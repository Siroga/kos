"use client";
import Image from "next/image";
import styles from "./page.module.css";
import { use } from "react";
import React, { useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";
import { IItem } from "@/types/types";

export default function Home() {
  const ordersRef = React.createRef();
  const [score, setScore] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
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

    // Listen for incoming messages
    socket.on("chat message1", (message: IItem) => {
      console.log("chat message1");
      setMessages((prevMessages) => [...prevMessages, message.number!]);
      btnAdd(message);
    });

    socket.on("items_list", (message: IItem[]) => {
      console.log(message);
      let inprogressItems = document.getElementById("inprogress-items") as any;
      let readyItems = document.getElementById("readyItems") as any;

      inprogressItems.innerHTML = "";
      readyItems.innerHTML = "";

      message.forEach((item) => {
        btnAdd(item);
      });
      // setMessages((prevMessages) => [...prevMessages, message]);
      // btnAdd(message);
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  function btnAdd(val: IItem) {
    let inprogressItems = document.getElementById("inprogress-items") as any;
    let readyItems = document.getElementById("readyItems") as any;
    let newDiv = document.createElement("button") as any;

    let newScore =
      val !== null && !Number.isNaN(parseInt(val.number!))
        ? parseInt(val.number!)
        : score + 1;
    setScore(newScore);
    console.log(score);

    newDiv.id = newScore;

    newDiv.appendChild(document.createTextNode(newScore.toString()));
    newDiv.onclick = () => {
      const item: IItem = {
        number: val.number,
        status: val.status === "New" ? "Ready" : "Done",
      };
      socket.emit("update_item", item);
      // let inprogressItem = document.getElementById(newDiv.id) as any;
      // inprogressItem.parentNode.removeChild(inprogressItem);
      // let readyItemDiv = document.createElement("button");
      // readyItemDiv.id = inprogressItem.id;
      // readyItemDiv.appendChild(
      //   document.createTextNode(inprogressItem.textContent)
      // );
      // Holidat.onclick = () => {
      //   let deletDiv = document.getElementById(readyItemDiv.id) as any;
      //   readyItems.removeChild(deletDiv);
      // };
      // readyItems.appendChild(readyItemDiv);
      // console.log(inprogressItem);
    };
    console.log(val);
    if (val.status === "New") {
      inprogressItems.appendChild(newDiv);
    } else if (val.status === "Ready") {
      readyItems.appendChild(newDiv);
    }
  }

  return (
    <div>
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
