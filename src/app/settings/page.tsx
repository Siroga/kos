"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.scss";
import { verifyPasswordOnServer } from "@/utils/utils";
import { socket } from "@/app/lib/socket";

interface IDevice {
  mac: string;
  name: string;
}

export default function SettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);
  const [adapterPowered, setAdapterPowered] = useState(true);
  const [savedMac, setSavedMac] = useState<string | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanCountdown, setScanCountdown] = useState(0);
  const [discoveredDevices, setDiscoveredDevices] = useState<IDevice[]>([]);

  const [connectingMac, setConnectingMac] = useState<string | null>(null);
  const [isTestingPrint, setIsTestingPrint] = useState(false);

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function authenticate() {
      const pass = window.prompt("Zadejte heslo");
      if (!pass) {
        window.location.replace("/");
        return;
      }

      const isValid = await verifyPasswordOnServer(pass);

      if (!isValid) {
        window.location.replace("/");
      } else {
        if (isMounted) {
          setIsAuthenticated(true);
        }
      }
    }

    authenticate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Check adapter & config
    socket.emit("bt_check_adapter");
    socket.emit("bt_get_config");

    socket.on("priter_status", (status: boolean) => {
      setIsPrinterConnected(status);
    });

    socket.on("bt_adapter_status", (data: { powered: boolean }) => {
      setAdapterPowered(data.powered);
    });

    socket.on("bt_config_data", (data: { printerMac: string | null }) => {
      setSavedMac(data.printerMac);
    });

    socket.on("bt_scan_result", (device: IDevice) => {
      setDiscoveredDevices((prev) => {
        if (prev.some((d) => d.mac === device.mac)) return prev;
        return [...prev, device];
      });
    });

    socket.on("bt_scan_done", (res: { success?: boolean; error?: string }) => {
      setIsScanning(false);
      setScanCountdown(0);
      if (res.error) {
        setMessage({ text: `Chyba při skenování: ${res.error}`, type: "error" });
      }
    });

    socket.on("bt_connect_status", (res: { success: boolean; mac?: string; error?: string }) => {
      setConnectingMac(null);
      if (res.success) {
        setSavedMac(res.mac || null);
        setMessage({ text: `Tiskárna ${res.mac} úspěšně připojena`, type: "success" });
      } else {
        setMessage({ text: `Chyba připojení: ${res.error || "Nepodařilo se připojit"}`, type: "error" });
      }
    });

    socket.on("bt_print_result", (res: { success: boolean; error?: string }) => {
      setIsTestingPrint(false);
      if (res.success) {
        setMessage({ text: "Zkušební tisk proběhl úspěšně", type: "success" });
      } else {
        setMessage({ text: `Chyba tisku: ${res.error || "Nepodařilo se vytisknout"}`, type: "error" });
      }
    });

    socket.on("bt_remove_all_status", (res: { success: boolean; error?: string }) => {
      if (res.success) {
        setSavedMac(null);
        setDiscoveredDevices([]);
        setMessage({ text: "Všechna spárovaná zařízení byla odebrána", type: "success" });
      } else {
        setMessage({ text: `Chyba při odebírání zařízení: ${res.error}`, type: "error" });
      }
    });

    return () => {
      socket.off("priter_status");
      socket.off("bt_adapter_status");
      socket.off("bt_config_data");
      socket.off("bt_scan_result");
      socket.off("bt_scan_done");
      socket.off("bt_connect_status");
      socket.off("bt_print_result");
      socket.off("bt_remove_all_status");
    };
  }, [isAuthenticated]);

  // Countdown interval during scan
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isScanning && scanCountdown > 0) {
      timer = setInterval(() => {
        setScanCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isScanning, scanCountdown]);

  const handleStartScan = () => {
    if (!adapterPowered) {
      setMessage({ text: "Bluetooth-adaptér je vypnutý", type: "error" });
      return;
    }
    setDiscoveredDevices([]);
    setMessage(null);
    setIsScanning(true);
    setScanCountdown(10);
    socket.emit("bt_scan_start");
  };

  const handleConnect = (mac: string) => {
    setMessage(null);
    setConnectingMac(mac);
    socket.emit("bt_connect", { mac });
  };

  const handleDisconnect = () => {
    setMessage(null);
    socket.emit("bt_disconnect");
    setSavedMac(null);
    setMessage({ text: "Tiskárna byla odpojena", type: "success" });
  };

  const handleRemoveAll = () => {
    setMessage(null);
    socket.emit("bt_remove_all");
  };

  const handleTestPrint = () => {
    setMessage(null);
    setIsTestingPrint(true);
    socket.emit("bt_test_print");
  };

  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordMsg({ text: "Nová hesla se neshodují", type: "error" });
      return;
    }

    if (!newPasswordInput.trim()) {
      setPasswordMsg({ text: "Nové heslo nesmí být prázdné", type: "error" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPasswordInput,
          newPassword: newPasswordInput,
        }),
      });

      const data = await res.json();
      setIsChangingPassword(false);

      if (res.ok && data.success) {
        setPasswordMsg({ text: "Heslo bylo úspěšně změněno", type: "success" });
        setCurrentPasswordInput("");
        setNewPasswordInput("");
        setConfirmPasswordInput("");
      } else {
        setPasswordMsg({ text: data.error || "Chyba při změně hesla", type: "error" });
      }
    } catch (err: any) {
      setIsChangingPassword(false);
      setPasswordMsg({ text: "Chyba serveru při změně hesla", type: "error" });
    }
  };

  const [isRebooting, setIsRebooting] = useState(false);
  const [rebootMsg, setRebootMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleReboot = async () => {
    const confirmed = window.confirm("Opravdu chcete restartovat zařízení?");
    if (!confirmed) return;

    setRebootMsg(null);
    setIsRebooting(true);

    try {
      const res = await fetch("/api/system/reboot", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRebootMsg({ text: "Zařízení se restartuje...", type: "success" });
      } else {
        setIsRebooting(false);
        setRebootMsg({ text: data.error || "Chyba při restartu zařízení", type: "error" });
      }
    } catch (err: any) {
      setIsRebooting(false);
      setRebootMsg({ text: "Chyba při odesílání požadavku na restart", type: "error" });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.mainBlock}>
      <h1 className={styles.title}>Nastavení</h1>
      <div className={styles.content}>
        <div className={styles.section}>
          <h2>Bluetooth Tiskárna</h2>

          {!adapterPowered && (
            <div className={styles.warningBox}>
              ⚠️ Bluetooth-adaptér na zařízení je vypnutý. Zapněte Bluetooth pro vyhledávání tiskáren.
            </div>
          )}

          <div className={styles.statusCard}>
            <div className={styles.statusRow}>
              <span>Stav připojení:</span>
              <span className={`${styles.dot} ${isPrinterConnected ? styles.green : styles.red}`}></span>
              <strong>{isPrinterConnected ? "Připojeno" : "Odpojeno"}</strong>
            </div>
            {savedMac && (
              <div className={styles.statusRow}>
                <span>Uložená MAC adresa:</span>
                <code>{savedMac}</code>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button
              className={styles.btnPrimary}
              onClick={handleStartScan}
              disabled={isScanning || !adapterPowered}
            >
              {isScanning ? `Hledám... (${scanCountdown}s)` : "Hledat tiskárny"}
            </button>

            {isPrinterConnected && (
              <button
                className={styles.btnSecondary}
                onClick={handleTestPrint}
                disabled={isTestingPrint}
              >
                {isTestingPrint ? "Tisknu..." : "Zkušební tisk"}
              </button>
            )}

            {savedMac && (
              <button className={styles.btnDanger} onClick={handleDisconnect}>
                Odpojit
              </button>
            )}

            <button className={styles.btnDanger} onClick={handleRemoveAll}>
              Odebrat všechna zařízení
            </button>
          </div>

          {message && (
            <div className={`${styles.toast} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          {discoveredDevices.length > 0 && (
            <div className={styles.deviceList}>
              <h3>Nalezená zařízení:</h3>
              {discoveredDevices.map((dev) => (
                <div key={dev.mac} className={styles.deviceItem}>
                  <div className={styles.deviceInfo}>
                    <span className={styles.deviceName}>{dev.name}</span>
                    <span className={styles.deviceMac}>{dev.mac}</span>
                  </div>
                  <button
                    className={styles.btnPrimary}
                    onClick={() => handleConnect(dev.mac)}
                    disabled={connectingMac === dev.mac}
                  >
                    {connectingMac === dev.mac ? "Připojuji..." : "Připojit"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.section} style={{ marginTop: "40px" }}>
          <h2>Změna hesla</h2>
          <form className={styles.passwordForm} onSubmit={handleChangePassword}>
            <div className={styles.inputGroup}>
              <label>Současné heslo</label>
              <input
                type="password"
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Nové heslo</label>
              <input
                type="password"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Potvrzení nového hesla</label>
              <input
                type="password"
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={isChangingPassword}
              style={{ marginTop: "10px" }}
            >
              {isChangingPassword ? "Ukládám..." : "Změnit heslo"}
            </button>
          </form>

          {passwordMsg && (
            <div className={`${styles.toast} ${styles[passwordMsg.type]}`}>
              {passwordMsg.text}
            </div>
          )}
        </div>

        <div className={styles.section} style={{ marginTop: "40px" }}>
          <h2>Správa systému</h2>
          <p style={{ color: "#666", marginBottom: "15px" }}>
            Restartuje zařízení. Akce vyžaduje potvrzení.
          </p>
          <button
            className={styles.btnDanger}
            onClick={handleReboot}
            disabled={isRebooting}
          >
            {isRebooting ? "Restartuji..." : "Restartovat zařízení"}
          </button>

          {rebootMsg && (
            <div className={`${styles.toast} ${styles[rebootMsg.type]}`}>
              {rebootMsg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
