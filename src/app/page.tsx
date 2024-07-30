"use client";
import { logIn } from "@/utils/utils";
import styles from "./page.module.scss";
import React, { useState, useEffect } from "react";

export default function Home() {
  logIn();

  return (
    <div className={styles.mainBlock}>
      <a href="/pokladna">
        <div className={styles.menuItem}>
          <span>Pokladna</span>
        </div>
      </a>
      <a href="/kuchyne">
        <div className={styles.menuItem}>
          <span>Kuchyně</span>
        </div>
      </a>
      <a href="/pizza">
        <div className={styles.menuItem}>
          <span>Pizza</span>
        </div>
      </a>
    </div>
  );
}
