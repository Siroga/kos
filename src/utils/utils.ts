import { socket } from "@/app/lib/socket";
import { MenuTypeEnum } from "@/types/menu";
import { IItem } from "@/types/types";

export const addItemsToPage = (items: IItem[], type: MenuTypeEnum): number => {
  let inprogressItems = document.getElementById("inprogress-items") as any;
  let readyItems = document.getElementById("readyItems") as any;
  let newItems = document.getElementById("new-items") as any;

  inprogressItems.innerHTML = "";
  readyItems.innerHTML = "";
  newItems.innerHTML = "";

  let lastIndex = 0;

  items.forEach((item) => {
    if (item.number! > lastIndex) {
      lastIndex = item.number!;
    }

    if (type === item.type || type === MenuTypeEnum.ALL) {
      btnAdd(item);
      if (item.status === "New" && item.sound) {
        playSound();
      }
    }
  });
  return lastIndex;
};

export const btnAdd = (val: IItem, score: number = 1) => {
  let newItems = document.getElementById("new-items") as any;
  let inprogressItems = document.getElementById("inprogress-items") as any;
  let readyItems = document.getElementById("readyItems") as any;
  let newDiv = document.createElement("button") as any;

  let newScore = val !== null && val.number! ? val.number! : 1;

  newDiv.id = newScore;

  newDiv.appendChild(document.createTextNode(newScore.toString()));
  newDiv.appendChild(document.createElement("br"));
  const sp1 = document.createElement("div");
  sp1.innerText = val.count! > 1 ? val.name! + "-" + val.count! : val.name!;

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

  return newScore;
};

export const playSound = () => {
  try {
    const audio = new Audio("/sound.wav");
    audio.play();
  } catch (e) {}
};
