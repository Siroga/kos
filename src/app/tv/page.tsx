"use client";
import Image from "next/image";
import styles from "./page.module.sass";
import { use } from "react";
import React, { useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";
import { IItem } from "@/types/types";
import ReactDOM from "react-dom";
import Modal from "react-modal";
import { IMenu, MenuItems, MenuTypeEnum } from "@/types/menu";

export default function Home() {
  const ordersRef = React.createRef<HTMLDivElement>();
  const [score, setScore] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  const [socket, setSocket] = useState<Socket>(io());

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
      btnAdd(item);
    });
  });

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
    sp1.innerText =
      val.type === MenuTypeEnum.PIZZA ? "PIZZA" : val.name! + "-" + val.count!;
    newDiv.appendChild(sp1);

    // const sp = document.createElement("div");
    // sp.innerText = ""; //val.comment ? val.comment! : " ";
    // newDiv.appendChild(sp);
    newDiv.onclick = () => {
      const item: IItem = {
        number: val.number,
        status: val.status === "New" ? "Ready" : "Done",
      };
      socket.emit("update_item", item);
    };
    if (val.status === "New" || val.status === "Progress") {
      inprogressItems.appendChild(newDiv);
    } else if (val.status === "Ready") {
      readyItems.appendChild(newDiv);
    }
  }

  return (
    <div>
      <div className="main" ref={ordersRef}>
        <div className="orderProgress">
          <h1>Objednávka zahájena TV</h1>
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
