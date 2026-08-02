"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.scss";
import { verifyPasswordOnServer } from "@/utils/utils";

export default function SettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.mainBlock}>
      <h1 className={styles.title}>Nastavení</h1>
      <div className={styles.content}>
        <p>Vítá vás stránka nastavení.</p>
      </div>
    </div>
  );
}
