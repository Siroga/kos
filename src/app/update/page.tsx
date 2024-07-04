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

  function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
    fetch("/upgrade", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({ keyword: "menaiala" }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  return (
    <div>
      <div className="main" ref={ordersRef}>
        <button onClick={handleUpdate}>Update </button>
      </div>
    </div>
  );
}
