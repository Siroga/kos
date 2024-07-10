"use client";
import styles from "./page.module.scss";
import React, { useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";
import { IItemsList } from "@/types/types";
import { addItemsToPage } from "@/utils/utils";
import { MenuTypeEnum } from "@/types/menu";

export default function Home() {
  const ordersRef = React.createRef<HTMLDivElement>();
  const [isConnected, setIsConnected] = useState(false);
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
    return addItemsToPage(items.items, MenuTypeEnum.ALL, false, true);
  }

  return (
    <div>
      <div className="mainTv" ref={ordersRef}>
        <div className={`orderProgress`}>
          <h1>Objednávka zahájena</h1>
          <div className={`items inprogressItems`} id="inprogress-items" />
        </div>
        <div className="pageDivider" />
        <div className={`orderCompleted`}>
          <h1>Objednávka je připravena</h1>
          <div className={`items readyItems`} id="readyItems" />
        </div>
      </div>
    </div>
  );
}
