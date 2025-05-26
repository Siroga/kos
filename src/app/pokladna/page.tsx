"use client";
import Image from "next/image";
import styles from "./page.module.scss";
import { use } from "react";
import React, { useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";
import { IItem, IItemsList } from "@/types/types";
import ReactDOM from "react-dom";
import Modal from "react-modal";
import { IMenu, MenuItems, MenuTypeEnum, PizzaItems } from "@/types/menu";
import { socket } from "@/app/lib/socket";
import { addItemsToPage, addItemsToPagePok, logIn } from "@/utils/utils";

export default function Home() {
  const ordersRef = React.createRef<HTMLDivElement>();
  const [score, setScore] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  // const [socket, setSocket] = useState<Socket>(io());
  const [modalIsOpen, setIsOpen] = React.useState(false);
  const [count, setCount] = useState(1);
  const [comment, setComment] = useState("");
  const [fullScreenSt, setFullScreen] = useState(false);
  const [isPrinterConnected, setPrinterIsConnected] = useState(false);

  logIn();

  const customStyles = {
    content: {
      top: "250px",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      color: "#000",
      maxWidth: "900px",
      maxHeight: "90hv",
      width: "90%",
    },
  };

  useEffect(() => {
    console.log("useEffect");

    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      console.log("onConnect");
      setIsConnected(true);
    }

    function onDisconnect() {
      console.log("onDisconnect");
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on("priter_status", (status: boolean) => {
      setPrinterIsConnected(status);
      console.log("Printer status:", status);
    });

    socket.on("items_list", (items: IItemsList) => {
      onItemsList(items);
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("items_list", onItemsList);
    };
  }, []);

  function onItemsList(items: IItemsList) {
    console.log("get data");
    setLastScore(() => {
      return items.lastIndex;
    });
    return addItemsToPagePok(items.items, MenuTypeEnum.ALL, false);
  }

  function addNew() {
    setCount(1);
    setComment("");
    setScore(lastScore >= 200 ? 1 : lastScore + 1);

    setIsOpen(true);
  }

  function fullScreen() {
    console.log(fullScreenSt);
    if (!fullScreenSt) {
      (document.body as any).requestFullscreen();
      setFullScreen(true);
    } else {
      document.exitFullscreen();
      setFullScreen(false);
    }
  }

  function addItem(menu: IMenu) {
    let item: IItem = {};
    const newScore = score > 200 ? 1 : score;
    item.number = newScore;
    if (item.number === null) return;
    item.id = menu.id;
    item.name = menu.shortName;
    item.count = count;
    item.comment = comment;
    item.status = "New";
    item.sound = true;
    item.type = menu.type;
    item.dateTime = new Date();
    socket.emit("add_item", item);
    setLastScore(newScore);
    setIsOpen(false);
  }

  function afterOpenModal() {
    // references are now sync'd and can be accessed.
  }

  function closeModal() {
    setIsOpen(false);
  }

  return (
    <div id="container">
      <button className={styles.newButton} type="submit" onClick={addNew}>
        +
      </button>
      <div
        className={`${styles.printer} ${
          isPrinterConnected ? styles.green : styles.red
        }`}
      >
        Printer
      </div>
      <button className="fullScreen" type="submit" onClick={fullScreen}>
        <svg
          width="30px"
          height="30px"
          viewBox="0 0 32 32"
          id="i-fullscreen"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="currentcolor"
          strokeWidth="2"
        >
          <path d="M4 12 L4 4 12 4 M20 4 L28 4 28 12 M4 20 L4 28 12 28 M28 20 L28 28 20 28" />
        </svg>
      </button>
      <Modal
        isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Example Modal"
        ariaHideApp={false}
      >
        <div className={styles.modal}>
          <div className={styles.flex}>
            <div className={`${styles.menuItems} ${styles.kitcnenItems}`}>
              {MenuItems.map((item, i) => {
                // Return the element. Also pass key
                return (
                  <button
                    key={i}
                    onClick={() => {
                      addItem(item);
                    }}
                    className={
                      item.id === 1
                        ? styles.green
                        : item.id === 2
                        ? styles.blue
                        : ""
                    }
                  >
                    {item.shortName} {/* <br /> <span>{item.name}</span> */}
                  </button>
                );
              })}
            </div>
            <div className={`${styles.menuItems} ${styles.pizzaItems}`}>
              {PizzaItems.map((item, i) => {
                // Return the element. Also pass key
                return (
                  <button
                    key={i}
                    onClick={() => {
                      addItem(item);
                    }}
                  >
                    {item.id} {item.shortName}{" "}
                    {/* <br /> <span>{item.name}</span> */}
                  </button>
                );
              })}
            </div>
          </div>
          <div className={styles.inlineInputs}>
            <div>
              Číslo:{" "}
              <input
                type="number"
                value={score}
                min={1}
                max={200}
                onFocus={(e) => {
                  e.target.select();
                }}
                onChange={(e) => {
                  setScore(
                    parseInt(e.currentTarget.value) > 200 ||
                      parseInt(e.currentTarget.value) < 1 ||
                      Number.isNaN(parseInt(e.currentTarget.value))
                      ? score
                      : parseInt(e.currentTarget.value)
                  );
                }}
              ></input>
            </div>
            <div>
              Množství:{" "}
              <input
                type="number"
                value={count}
                min={1}
                onFocus={(e) => {
                  e.target.select();
                }}
                onChange={(e) => {
                  const c = setCount(
                    parseInt(e.currentTarget.value) < 1 ||
                      Number.isNaN(parseInt(e.currentTarget.value))
                      ? 1
                      : parseInt(e.currentTarget.value)
                  );
                }}
              ></input>
            </div>
            <div>
              Poznámka:{" "}
              <input
                type="text"
                className={styles.poznamka}
                value={comment}
                onChange={(e) => {
                  setComment(e.currentTarget.value);
                }}
              ></input>
            </div>
          </div>
        </div>
      </Modal>
      <div className={`main ${styles.pok}`} ref={ordersRef}>
        <div className={`orderNew orderNewPok`}>
          <h1>Nová objednávka</h1>
          <div className={`items newItems newItemsPok`} id="new-items" />
        </div>
      </div>
    </div>
  );
}
