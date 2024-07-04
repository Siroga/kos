"use client";
import Image from "next/image";
import styles from "./pizza.module.scss";
import { use } from "react";
import React, { useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";
import { IItem } from "@/types/types";
import ReactDOM from "react-dom";
import Modal from "react-modal";
import { IMenu, MenuTypeEnum, PizzaItems } from "@/types/menu";
import { socket } from "@/app/lib/socket";

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

  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      color: "#000",
      maxWidth: "665px",
      // height: "100%",
    },
  };

  //let socket: any;

  useEffect(() => {
    console.log("useEffect");

    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      console.log("onConnect");
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);
      console.log(socket.io.engine.transport.name);
    }

    function onDisconnect() {
      console.log("onDisconnect");
      setIsConnected(false);
      setTransport("N/A");
    }

    socket.on("disconnect", onDisconnect);

    socket.on("items_list", (message: IItem[]) => {
      onItemsList(message);
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("items_list", onItemsList);
    };
  }, []);

  function onItemsList(message: IItem[]) {
    console.log(message);
    let inprogressItems = document.getElementById("inprogress-items") as any;
    let readyItems = document.getElementById("readyItems") as any;
    let newItems = document.getElementById("new-items") as any;

    inprogressItems.innerHTML = "";
    readyItems.innerHTML = "";
    newItems.innerHTML = "";

    let lastIndex = 0;

    message.forEach((item) => {
      if (item.number! > lastIndex) {
        lastIndex = item.number!;
      }
      setLastScore(lastIndex);
      if (item.type === MenuTypeEnum.PIZZA) {
        btnAdd(item);
        if (item.status === "New" && item.sound) {
          playSound();
        }
      }
    });
  }

  function playSound() {
    try {
      const audio = new Audio("/sound.wav");
      audio.play();
    } catch (e) {}
  }

  function addNew() {
    setCount(1);
    setComment("");
    setScore(lastScore + 1);

    setIsOpen(true);
  }

  function addItem(menu: IMenu) {
    let item: IItem = {};
    const newScore = score >= 200 ? 1 : score;
    item.number = newScore;
    if (item.number === null) return;
    item.name = menu.shortName;
    item.count = count;
    item.comment = comment;
    item.status = "New";
    item.sound = true;
    item.type = menu.type;
    socket.emit("add_item", item);
    setLastScore(newScore);
    setIsOpen(false);
  }

  function btnAdd(val: IItem) {
    let newItems = document.getElementById("new-items") as any;
    let inprogressItems = document.getElementById("inprogress-items") as any;
    let readyItems = document.getElementById("readyItems") as any;
    let newDiv = document.createElement("button") as any;

    let newScore = val !== null && val.number! ? val.number! : score + 1;
    setScore(newScore);

    newDiv.id = newScore;

    newDiv.appendChild(document.createTextNode(newScore.toString()));
    newDiv.appendChild(document.createElement("br"));
    const sp1 = document.createElement("div");
    sp1.innerText = val.name!;
    newDiv.appendChild(sp1);

    const sp = document.createElement("div");
    sp.innerText = val.comment ? val.comment! : " ";
    newDiv.appendChild(sp);
    newDiv.onclick = () => {
      const item: IItem = {
        number: val.number,
        type: val.type,
        status:
          val.status === "New"
            ? "Progress"
            : val.status === "Progress"
            ? "Ready"
            : "Done",
      };
      socket.emit("update_item", item);
    };
    if (val.status === "New") {
      newItems.appendChild(newDiv);
    } else if (val.status === "Ready") {
      readyItems.appendChild(newDiv);
    } else if (val.status === "Progress") {
      inprogressItems.appendChild(newDiv);
    }
  }

  function afterOpenModal() {
    // references are now sync'd and can be accessed.
  }

  function closeModal() {
    setIsOpen(false);
  }

  return (
    <div>
      <button className="new-button" type="submit" onClick={addNew}>
        +
      </button>
      <Modal
        isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Example Modal"
        ariaHideApp={false}
      >
        <div>
          <div className={`menu-items ${styles.menuItems}`}>
            {PizzaItems.map((item, i) => {
              // Return the element. Also pass key
              return (
                <button
                  key={i}
                  onClick={() => {
                    addItem(item);
                  }}
                >
                  {item.shortName} {/* <br /> <span>{item.name}</span> */}
                </button>
              );
            })}
          </div>
          <div className="inline-inputs">
            <div>
              Číslo:{" "}
              <input
                type="number"
                value={score}
                onChange={(e) => {
                  setScore(
                    parseInt(e.currentTarget.value) > 200 ||
                      parseInt(e.currentTarget.value) < 1
                      ? 1
                      : parseInt(e.currentTarget.value)
                  );
                }}
              ></input>
            </div>
            {/* <div>
              Množství:{" "}
              <input
                type="number"
                value={count}
                onChange={(e) => {
                  const c = setCount(
                    parseInt(e.currentTarget.value) < 1
                      ? 1
                      : parseInt(e.currentTarget.value)
                  );
                }}
              ></input>
            </div> */}
            <div>
              Poznámka:{" "}
              <input
                type="text"
                className="poznamka"
                value={comment}
                onChange={(e) => {
                  setComment(e.currentTarget.value);
                }}
              ></input>
            </div>
          </div>
        </div>
      </Modal>
      <div className="header">
        <a href="/">Kuchyně</a>
        <a href="/pizza">Pizza</a>
      </div>
      <div className={`main ${styles.mainPizza}`} ref={ordersRef}>
        <div className={`${styles.orderNew}`}>
          <h1>Nová objednávka</h1>
          <div className={styles.newItems} id="new-items" />
        </div>
        <div className={`pageDivider ${styles.pageLeftDivider}`} />
        <div className={`orderProgress ${styles.orderProgress}`}>
          <h1>Objednávka se připravuje</h1>
          <div
            className={`inprogress-items ${styles.inprogressItems}`}
            id="inprogress-items"
          />
        </div>
        <div className={`pageDivider ${styles.pageRightDivider}`} />
        <div className={`orderCompleted ${styles.orderCompleted}`}>
          <h1>Objednávka je připravena</h1>
          <div className={`ready-items ${styles.readyItems}`} id="readyItems" />
        </div>
      </div>
    </div>
  );
}
