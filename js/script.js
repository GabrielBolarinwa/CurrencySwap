import { countryList } from "./codes.js";
const apiURL = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies`;

const dropdowns = document.querySelectorAll(".currencySelect");
const fromCurr = document.querySelector(".from select");
const toCurr = document.querySelector(".to select");
const msgToText = document.querySelector(".msg p.toRate");
const msgFromText = document.querySelector(".msg p.fromRate");
let amount = document.querySelector(".amount input");
const display = document.getElementById("display");
let currencyData = {};
const toastBox = document.getElementById("toastBox");
const pairButtons = document.querySelectorAll(".pairs .pair-buttons");
const swapCurrencyButton = document.getElementById("swapCurrency");
const refreshRatesButton = document.getElementById("refreshRates");
let success = 0;
let total = 0;
async function init() {
  for (const select of dropdowns) {
    for (const currCode in countryList) {
      if (!Object.hasOwn(countryList, currCode)) continue;
      let newOption = document.createElement("option");
      newOption.textContent = currCode.toUpperCase();
      newOption.value = currCode;
      if (select.name === "from" && currCode === "usd") {
        newOption.selected = true;
      }
      if (select.name === "to" && currCode === "ngn") {
        newOption.selected = true;
      }
      select.append(newOption);
    }
  }

  for (const currCode in countryList) {
    if (!Object.hasOwn(countryList, currCode)) continue;
    const key = `currency-${currCode}`;
    if (localStorage.getItem(key)) {
      currencyData[currCode.toLowerCase()] = JSON.parse(
        localStorage.getItem(key),
      );
      if (
        Date.now() - new Date(currencyData[currCode.toLowerCase()].date) >=
        86400000
      ) {
        success = 0;
        handleRateExchange(currCode, key);
      }
    } else {
      refreshRatesButton.children[0].classList.add("rotateLoader");

      refreshRatesButton.ariaBusy = true;

      await handleRateExchange(currCode, key);
      refreshRatesButton.children[0].classList.remove("rotateLoader");

      refreshRatesButton.ariaBusy = false;
    }
    total++;
  }
  success > 0 &&
    showToast(
      `${success} ${success > 1 ? "currencies" : "currency"} now available`,
      "success",
    );

  document.getElementById("totalCurrencies").textContent = total;
  for (const button of pairButtons) {
    const pairRateText = button.querySelector("span");
    const pairRate = getCachedRate(
      pairRateText.dataset.from,
      pairRateText.dataset.to,
    );
    if (pairRate) {
      pairRateText.textContent = `${pairRate.toFixed(2)}`;
    }
    button.addEventListener("click", () => {
      Array.from(fromCurr.options).map((option) => {
        if (option.value === pairRateText.dataset.from) {
          option.selected = true;
          handleFormInput();
        }
      });
      Array.from(toCurr.options).map((option) => {
        if (option.value === pairRateText.dataset.to) {
          option.selected = true;
          handleFormInput();
        }
      });
    });
  }
  setLocalStorageItems();
  getExchangeRate();
}

function setLocalStorageItems() {
  if (localStorage.getItem("currentAmount")) {
    amount.value = Number(localStorage.getItem("currentAmount"));
  }

  if (localStorage.getItem("fromCurr")) {
    fromCurr.value = localStorage.getItem("fromCurr");
  }

  if (localStorage.getItem("toCurr")) {
    toCurr.value = localStorage.getItem("toCurr");
  }
}

navigator.onLine
  ? init()
  : localStorage.getItem("usd")
    ? showToast("You are offline and will use cached currency data", "warning")
    : showToast(
        "You are offline and there is no cached data, please connect to the internet to get realtime values",
      );
async function handleRateExchange(currCode, key) {
  try {
    const data = await fetchRates(currCode.toLowerCase());
    if (data) {
      localStorage.setItem(key, JSON.stringify(data));
      currencyData[currCode.toLowerCase()] = data;
      success++;
    } else {
      showToast(
        `Failed to get currency data for ${currCode} check your connection and try again`,
        "error",
      );
    }
  } catch (err) {
    console.error("Failed to fetch rates for", currCode, err);
  }
}

function getAllRates() {
  success = 0;
  const promises = [];
  for (let currCode in countryList) {
    if (!Object.hasOwn(countryList, currCode)) continue;
    const key = `currency-${currCode}`;
    promises.push(handleRateExchange(currCode, key));
    success++;
  }
  showToast(
    `${success} ${success > 1 ? "currencies" : "currency"} now available`,
    "success",
  );
  return Promise.all(promises);
}

async function fetchRates(currCode) {
  try {
    const response = await fetch(`${apiURL}/${currCode}.json`, {
      method: "GET",
      cache: "no-cache",
    });
    if (response.ok && response.status === 200) {
      return await response.json();
    } else {
      showToast(
        `Problem getting currency ${currCode.toUpperCase()} rates, please retry`,
        "warning",
      );
      return null;
    }
  } catch (error) {
    showToast(
      `Failed to get currency data for ${currCode.toUpperCase()} check your connection and try again`,
      "error",
    );
    console.error("Fetch error:", error);
    throw new Error(error);
  }
}

function getCachedRate(fromCode, toCode) {
  const fromCodeLower = fromCode.toLowerCase();
  const toCodeLower = toCode.toLowerCase();

  const currencyObj = currencyData[fromCodeLower];
  if (!currencyObj) {
    console.warn(`No cached data for ${fromCode}`);
    return null;
  }

  const rates = currencyObj[fromCodeLower];
  if (rates && rates[toCodeLower]) {
    return rates[toCodeLower];
  } else {
    console.warn(`No rate found for ${fromCode} to ${toCode}`);
    return null;
  }
}

function getExchangeRate() {
  const fromCode = fromCurr.value;
  const toCode = toCurr.value;
  const rate = getCachedRate(fromCode, toCode);
  if (rate === null) {
    showToast(
      "Exchange rate not available, please connect to the internet and try again.",
      "error",
    );
    return;
  }
  const finalAmount = amount.value * rate;
  const singleToCurrency = 1 * getCachedRate(fromCode, toCode);
  const singleFromCurrency = 1 * getCachedRate(toCode, fromCode);
  display.innerText = `${formatNumber(finalAmount)}`;
  msgToText.textContent = `1 ${fromCode.toUpperCase()} = ${singleToCurrency.toFixed(2)} ${toCode.toUpperCase()}`;
  msgFromText.textContent = `1 ${toCode.toUpperCase()} = ${singleFromCurrency.toFixed(2)} ${fromCode.toUpperCase()}`;
}

function formatNumber(number) {
  return new Intl.NumberFormat(navigator.language, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

const currencyForm = document.querySelector("form");
currencyForm.addEventListener("submit", (e) => {
  e.preventDefault();
});
async function refreshRates() {
  success = 0;
  refreshRatesButton.children[0].classList.add("rotateLoader");
  refreshRatesButton.ariaBusy = true;
  if (amount.value === "" || amount.value < 1) {
    amount.value = "1";
  }
  try {
    await getAllRates();
    getExchangeRate();
  } finally {
    refreshRatesButton.children[0].classList.remove("rotateLoader");
    refreshRatesButton.ariaBusy = false;
  }
}

Array.from(currencyForm.children).forEach((formElement) => {
  formElement.addEventListener("change", handleFormElementsChange);
});

function handleFormElementsChange(e) {
  e && e.preventDefault();
  localStorage.setItem("currentAmount", amount.value);
  if (amount.value === "" || amount.value < 1) {
    amount.value = "1";
  }
  handleFormInput();

  localStorage.setItem("fromCurr", fromCurr.value);
  localStorage.setItem("toCurr", toCurr.value);
}

amount.addEventListener("input", (e) => {
  e.preventDefault();
  localStorage.setItem("currentAmount", amount.value);
  setTimeout(() => {
    handleFormInput();
  }, 300);
});

function handleFormInput() {
  if (amount.value.includes("e")) {
    showToast("Invalid input", "error");
    return;
  }
  getExchangeRate();
}

function swapCurrencies() {
  let currentFrom = fromCurr.value;
  let currentTo = toCurr.value;
  fromCurr.value = currentTo;
  toCurr.value = currentFrom;
  handleFormInput();
}

function showToast(message, id) {
  toastBox.style.transform = "scaleX(1)";

  let toast = document.createElement("div");
  toast.classList.add("toast");
  toast.role = "alert";
  toast.ariaLive = "assertive";
  let messageIcon = document.createElement("span");
  let messageText = document.createElement("span");
  messageText.textContent = message;
  if (id === "error") {
    toast.ariaLabel = "error";
    toast.classList.add("error");
    messageIcon.dataset.lucide = "circle-x";
  } else if (id === "success") {
    toast.ariaLabel = "succes";
    toast.classList.add("success");
    messageIcon.dataset.lucide = "circle-check";
  } else if (id === "warning") {
    toast.ariaLabel = "Warning";
    toast.classList.add("invalid");
    messageIcon.dataset.lucide = "circle-alert";
  }
  toast.append(messageIcon, messageText);
  toastBox.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => {
    toast.remove();
    toastBox.style.transform = "scaleX(0)";
  }, 6000);
}

window.addEventListener("offline", () => {
  showToast("You are offline and will now use cached currency data", "warning");
});

window.addEventListener("online", () => {
  showToast(
    "You are back online and will you now receive realtime data",
    "success",
  );
});

swapCurrencyButton.addEventListener("click", swapCurrencies);
refreshRatesButton.addEventListener("click", refreshRates);

document.getElementById("themeSwitch")?.addEventListener("click", () => {
  if (document.body.classList.contains("light")) setTheme("Dark");
  else if (document.body.classList.contains("dark")) setTheme("Auto");
  else setTheme("Light");
});

let themeSetting = localStorage.getItem("themeSetting");

function setTheme(theme) {
  themeSetting = theme;
  if (themeSetting === "Dark") {
    if (document.body.classList.contains("light")) {
      document.body.classList.replace("light", "dark");
    } else {
      document.body.classList.add("dark");
    }
  } else if (themeSetting == "Light") {
    if (document.body.classList.contains("dark")) {
      document.body.classList.replace("dark", "light");
    } else {
      document.body.classList.add("light");
    }
  } else if (themeSetting == "Auto") {
    document.body.classList.remove("light", "dark");
  }

  localStorage.setItem("themeSetting", themeSetting);
}

setTheme(themeSetting);
