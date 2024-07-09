"use client";
import Image from "next/image";
import styles from "./page.module.css";
import { use } from "react";
import React, { useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";
import { IItem } from "@/types/types";
import ReactDOM from "react-dom";
import Modal from "react-modal";
import { IMenu, MenuItems, MenuTypeEnum, PizzaItems } from "@/types/menu";

export default function Home() {
  const ordersRef = React.createRef<HTMLDivElement>();
  const [score, setScore] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  const [socket, setSocket] = useState<Socket>(io());
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
    // setSocket(io());

    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      console.log("onConnect");
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);
      console.log(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport: any) => {
        console.log("upgrade");
        setTransport(transport.name);
        console.log(transport.name);
      });
    }

    function onDisconnect() {
      console.log("onDisconnect");
      setIsConnected(false);
      setTransport("N/A");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  socket.on("items_list", (message: IItem[]) => {
    let inprogressItems = document.getElementById("inprogress-items") as any;
    let readyItems = document.getElementById("readyItems") as any;

    inprogressItems.innerHTML = "";
    readyItems.innerHTML = "";

    let lastIndex = 0;
    message.forEach((item) => {
      if (item.number! > lastIndex) {
        lastIndex = item.number!;
      }
      setLastScore(lastIndex);
      if (item.type === MenuTypeEnum.KITCHEN) {
        btnAdd(item);
        if (item.status === "New" && item.sound) {
          playSound();
        }
      }
    });
  });

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
    item.sound = true;
    item.type = MenuTypeEnum.KITCHEN;
    item.status = "New";
    socket.emit("add_item", item);
    setLastScore(newScore);
    setIsOpen(false);
  }

  function btnAdd(val: IItem) {
    let inprogressItems = document.getElementById("inprogress-items") as any;
    let readyItems = document.getElementById("readyItems") as any;
    let newDiv = document.createElement("button") as any;

    let newScore = val !== null && val.number! ? val.number! : score + 1;
    setScore(newScore);

    newDiv.id = newScore;

    newDiv.appendChild(document.createTextNode(newScore.toString()));
    newDiv.appendChild(document.createElement("br"));
    const sp1 = document.createElement("div");
    sp1.innerText = val.name! + "-" + val.count!;
    newDiv.appendChild(sp1);

    const sp = document.createElement("div");
    sp.innerText = val.comment ? val.comment! : " ";
    newDiv.appendChild(sp);
    newDiv.onclick = () => {
      const item: IItem = {
        number: val.number,
        status: val.status === "New" ? "Ready" : "Done",
      };
      socket.emit("update_item", item);
    };
    if (val.status === "New") {
      inprogressItems.appendChild(newDiv);
    } else if (val.status === "Ready") {
      readyItems.appendChild(newDiv);
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
          <div className="flex">
            <div className="menu-items">
              {MenuItems.map((item, i) => {
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
            <div className="menu-items">
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
            <div>
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
            </div>
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
      <div className="main" ref={ordersRef}>
        <div className="orderProgress">
          <h1>Objednávka zahájena</h1>
          <div className="inprogress-items" id="inprogress-items" />
        </div>
        <div className="pageDivider" />
        <div className="orderCompleted">
          <h1>Objednávka je připravena</h1>
          <div className="ready-items" id="readyItems" />
        </div>
      </div>
    </div>
  );
}
