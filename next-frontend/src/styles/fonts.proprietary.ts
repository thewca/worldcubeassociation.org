import localFont from "next/font/local";

const ttNormsPro = localFont({
  src: [
    {
      path: "./fonts/TTNormsPro/TT_Norms_Pro_Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/TTNormsPro/TT_Norms_Pro_Light_Italic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "./fonts/TTNormsPro/TT_Norms_Pro_Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/TTNormsPro/TT_Norms_Pro_Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/TTNormsPro/TT_Norms_Pro_Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/TTNormsPro/TT_Norms_Pro_Condensed_ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  declarations: [
    // Determined using https://fontdrop.info/
    { prop: "ascent-override", value: "105%" },
    { prop: "descent-override", value: "-33%" },
  ],
});

export { ttNormsPro };
