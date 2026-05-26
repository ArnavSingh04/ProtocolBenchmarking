// Chatgpt by openAI was used to assist in the writing the code for the following file
import React from "react";
import { createRoot } from "react-dom/client";
import { Meteor } from "meteor/meteor";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./main.css";

Meteor.startup(() => {
  const container = document.getElementById("react-target");
  const root = createRoot(container);
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
});
