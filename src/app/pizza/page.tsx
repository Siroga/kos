"use client";
import styles from "./page.module.scss";
import React, { useState, useEffect } from "react";
import { IItem, IItemsList } from "@/types/types";
import { socket } from "@/app/lib/socket";
import { addItemsToPage, logIn } from "@/utils/utils";
import { MenuTypeEnum } from "@/types/menu";

export default function Home() {
  const ordersRef = React.createRef<HTMLDivElement>();
  const [isConnected, setIsConnected] = useState(false);
  const [fullScreenSt, setFullScreen] = useState(false);

  logIn();

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
    addItemsToPage(items.items, MenuTypeEnum.PIZZA);
  }

  function fullScreen() {
    console.log(fullScreenSt);
    if (!fullScreenSt) {
      (document.getElementById("container") as any).requestFullscreen();
      setFullScreen(true);
    }
    {
      document.exitFullscreen();
      setFullScreen(false);
    }
  }

  return (
    <div id="container">
      <button className="fullScreen" type="submit" onClick={fullScreen}>
        <svg
          width="30px"
          height="30px"
          viewBox="0 0 32 32"
          id="i-fullscreen"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="currentcolor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
        >
          <path d="M4 12 L4 4 12 4 M20 4 L28 4 28 12 M4 20 L4 28 12 28 M28 20 L28 28 20 28" />
        </svg>
      </button>
      <div className={`main ${styles.pizza}`} ref={ordersRef}>
        <div className={`orderNew`}>
          <h1>Nová objednávka</h1>
          <div className={`items newItems`} id="new-items" />
        </div>
        <div className={`pageDivider pageLeftDivider`} />
        <div className={`orderProgress`}>
          <h1>Objednávka se připravuje</h1>
          <div className={`items inprogressItems`} id="inprogress-items" />
        </div>
        <div className={`pageDivider pageRightDivider`} />
        <div className={`orderCompleted`}>
          <h1>Objednávka je připravena</h1>
          <div className={`items readyItems`} id="readyItems" />
        </div>
      </div>
    </div>
  );
}
