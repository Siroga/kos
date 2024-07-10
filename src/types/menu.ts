export interface IMenu {
  id: number;
  shortName: string;
  name: string;
  type: MenuTypeEnum;
}

export enum MenuTypeEnum {
  KITCHEN,
  PIZZA,
  ALL,
}

export const MenuItems: IMenu[] = [
  {
    id: 1,
    shortName: "VPÁ",
    name: "víděňské párky",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 2,
    shortName: "KL",
    name: "klobása",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 3,
    shortName: "VAJ",
    name: "vajíčka",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 4,
    shortName: "TO",
    name: "toast",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 5,
    shortName: "SEK",
    name: "sekaná",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 6,
    shortName: "POL",
    name: "polévka",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 7,
    shortName: "GUL",
    name: "gulášová",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 8,
    shortName: "ČES",
    name: "česnečka",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 9,
    shortName: "VÝV",
    name: "vývar",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 10,
    shortName: "LANG",
    name: "langoš",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 11,
    shortName: "SMS",
    name: "smažený sýr",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 12,
    shortName: "KŘ",
    name: "kuřecí řízek",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 13,
    shortName: "BR",
    name: "bramboráček",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 14,
    shortName: "UT",
    name: "utopenec",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 15,
    shortName: "KN",
    name: "knedlíky",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 16,
    shortName: "VÝP",
    name: "výpečky",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 17,
    shortName: "SPA",
    name: "spagety",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 18,
    shortName: "KAT",
    name: "katův šleh",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 19,
    shortName: "RIZ",
    name: "Rizoto",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 20,
    shortName: "SAL",
    name: "Salát",
    type: MenuTypeEnum.KITCHEN,
  },
  {
    id: 21,
    shortName: "UZK",
    name: "Knedliky",
    type: MenuTypeEnum.KITCHEN,
  },
];

export const PizzaItems: IMenu[] = [
  {
    id: 1,
    shortName: "Margharita",
    name: "Margharita",
    type: MenuTypeEnum.PIZZA,
  },
  {
    id: 2,
    shortName: "Salami",
    name: "Salami",
    type: MenuTypeEnum.PIZZA,
  },
  {
    id: 3,
    shortName: "Prosciutto",
    name: "Prosciutto",
    type: MenuTypeEnum.PIZZA,
  },
  {
    id: 4,
    shortName: "Hawaii",
    name: "Hawaii",
    type: MenuTypeEnum.PIZZA,
  },
  {
    id: 5,
    shortName: "Mexicana",
    name: "Mexicana",
    type: MenuTypeEnum.PIZZA,
  },
  {
    id: 6,
    shortName: "Diavolo",
    name: "Diavolo",
    type: MenuTypeEnum.PIZZA,
  },
  {
    id: 7,
    shortName: "Quattrostagioni",
    name: "Quattrostagioni",
    type: MenuTypeEnum.PIZZA,
  },
  {
    id: 8,
    shortName: "Quattroformaggi",
    name: "Quattroformaggi",
    type: MenuTypeEnum.PIZZA,
  },
];

export interface IMenu {
  id: number;
  shortName: string;
  name: string;
}
