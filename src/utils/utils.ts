import { socket } from "@/app/lib/socket";
import { MenuTypeEnum } from "@/types/menu";
import { IItem } from "@/types/types";

export const addItemsToPage = (
  items: IItem[],
  type: MenuTypeEnum,
  sound: boolean = true,
  isTv = false
): number => {
  let inprogressItems = document.getElementById("inprogress-items") as any;
  let readyItems = document.getElementById("readyItems") as any;

  inprogressItems.innerHTML = "";
  readyItems.innerHTML = "";

  if (!isTv) {
    let newItems = document.getElementById("new-items") as any;
    newItems.innerHTML = "";
  }

  let lastIndex = 0;

  items.forEach((item) => {
    if (item.number! > lastIndex) {
      lastIndex = item.number!;
    }

    if (type === item.type || type === MenuTypeEnum.ALL) {
      btnAdd(item, isTv);
      if (item.status === "New" && item.sound && sound) {
        playSound();
      }
    }
  });
  return lastIndex;
};

export const btnAdd = (val: IItem, isTv: boolean = false) => {
  let inprogressItems = document.getElementById("inprogress-items") as any;
  let readyItems = document.getElementById("readyItems") as any;
  let newItems = document.getElementById("new-items") as any;

  let newDiv = document.createElement("button") as any;

  newDiv.className = val.type === MenuTypeEnum.KITCHEN ? "red" : "yellow";

  let newScore = val !== null && val.number! ? val.number! : 1;

  newDiv.id = newScore;

  newDiv.appendChild(document.createTextNode(newScore.toString()));
  newDiv.appendChild(document.createElement("br"));
  const sp1 = document.createElement("div");
  if (val.type === MenuTypeEnum.KITCHEN || isTv) {
    sp1.innerText = val.count! > 1 ? val.name! + "-" + val.count! : val.name!;
  } else {
    sp1.innerText =
      val.count! > 1
        ? val.id! + "." + val.name! + "-" + val.count!
        : val.id! + "." + val.name!;
  }

  newDiv.appendChild(sp1);

  const sp = document.createElement("div");
  sp.innerText = val.comment ? val.comment! : " ";
  sp.className = "comment";
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

  if (isTv) {
    if (val.status === "Ready") {
      readyItems.appendChild(newDiv);
    } else if (val.status === "Progress" || val.status === "New") {
      inprogressItems.appendChild(newDiv);
    }
  } else {
    if (val.status === "New") {
      newItems.appendChild(newDiv);
    } else if (val.status === "Ready") {
      readyItems.appendChild(newDiv);
    } else if (val.status === "Progress") {
      inprogressItems.appendChild(newDiv);
    }
  }

  return newScore;
};

export const playSound = () => {
  try {
    const audio = new Audio("/sound.wav");
    audio.play();
  } catch (e) {}
};

export const btnAddPok = (val: IItem, isTv: boolean = false) => {
  let newItems = document.getElementById("new-items") as any;

  let newDiv = document.createElement("button") as any;

  newDiv.className = val.type === MenuTypeEnum.KITCHEN ? "red" : "yellow";

  let newScore = val !== null && val.number! ? val.number! : 1;

  newDiv.id = newScore;

  newDiv.appendChild(document.createTextNode(newScore.toString()));
  newDiv.appendChild(document.createElement("br"));
  const sp1 = document.createElement("div");

  if (val.type === MenuTypeEnum.KITCHEN) {
    sp1.innerText = val.count! > 1 ? val.name! + "-" + val.count! : val.name!;
  } else {
    sp1.innerText =
      val.count! > 1
        ? val.id! + "." + val.name! + "-" + val.count!
        : val.id! + "." + val.name!;
  }

  newDiv.appendChild(sp1);

  const sp = document.createElement("div");
  sp.innerText = val.comment ? val.comment! : " ";
  sp.className = "comment";
  newDiv.appendChild(sp);
  newDiv.onclick = () => {
    const item: IItem = {
      number: val.number,
      type: val.type,
      status: "Done",
    };
    socket.emit("update_item", item);
  };

  newItems.appendChild(newDiv);

  return newScore;
};

export const addItemsToPagePok = (
  items: IItem[],
  type: MenuTypeEnum,
  sound: boolean = true,
  isTv = false
): number => {
  let newItems = document.getElementById("new-items") as any;
  newItems.innerHTML = "";

  let lastIndex = 0;

  items.reverse().forEach((item) => {
    if (item.number! > lastIndex) {
      lastIndex = item.number!;
    }

    if (type === item.type || type === MenuTypeEnum.ALL) {
      btnAddPok(item, isTv);
      if (item.status === "New" && item.sound && sound) {
        playSound();
      }
    }
  });
  return lastIndex;
};

export const logIn = () => {
  if (typeof window === "undefined") return false;
  const key = "isLogined";
  const isLogined = (window! as any).localStorage.getItem(key);

  if (!isLogined) {
    let pass = (window! as any).prompt("Zadejte heslo");
    if (pass !== "JirkA1234") {
      (window! as any).location.replace("/");
    } else {
      (window! as any).localStorage.setItem(key, "1");
    }
  }
};
