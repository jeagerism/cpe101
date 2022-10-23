class Building {
  constructor(name, cost, effect, upgrades, locked = true) {
    this.name = name;
    this.amount = 0;
    this.originalCost = cost;
    this.cost = cost;
    this.multiplier = 1;
    this.baseEffect = effect;
    this.specialCPS = 0;
    this.effect = 0;
    this.upgrades = upgrades;
    this.locked = locked;
  }

  buy(amount) {
    let player = game.player;
    if (player.spendCookies(this.getCost(amount)) == true) {
      this.amount += amount;
      this.cost = Math.round(this.cost * Math.pow(1.15, amount));
      game.settings.recalculateCPS = true;
      let curIndex = game.utilities.getBuildingIndexByName(this.name);
      if (curIndex + 1 <= game.buildings.length - 1) {
        let nextBuilding = game.buildings[curIndex + 1];
        if (nextBuilding.locked == true) {
          nextBuilding.locked = false;
          game.constructShop();
        }
      }
    }
  }

  setCost() {
    this.cost = this.originalCost;
    for (let i = 0; i < this.amount; i++) {
      this.cost = Math.round(this.cost * 1.15);
    }
  }

  buyUpgrade(name) {
    let player = game.player;
    this.upgrades.forEach((upgrade) => {
      if (upgrade.name == name) {
        if (player.spendCookies(upgrade.cost) == true) {
          upgrade.owned = true;
          game.settings.recalculateCPS = true;
          return;
        }
      }
    });
  }

  calculateEffectOfUpgrades() {
    let player = game.player;
    let multiplier = 1;
    let buildingCount = game.utilities.getBuildingCount();
    this.specialCPS = 0;
    if (this.name == "Cursor") {
      game.player.aMPC = 1;
    }
    this.upgrades.forEach((upgrade) => {
      if (upgrade.owned == true) {
        if (upgrade.special == false) {
          multiplier *= 2;
          if (this.name == "Cursor") {
            player.aMPC *= 2;
          }
        } else {
          // Special casing for all special types of upgrades
          // There may at some point be more than just cursors here, as theres special stuff for grandmas as well.
          switch (this.name) {
            case "Cursor":
              let nonCursorBuildingCount = buildingCount - this.amount;
              this.specialCPS +=
                upgrade.special * nonCursorBuildingCount * this.amount;
              player.aMPC += upgrade.special * nonCursorBuildingCount;
          }
        }
      }
    });
    return multiplier;
  }

  getCPS() {
    this.multiplier = this.calculateEffectOfUpgrades();
    this.effect =
      this.baseEffect * this.amount * this.multiplier + this.specialCPS;
    return this.effect;
  }

  getCost(amount) {
    let bulkCost = this.cost;
    let tempPrice = this.cost;
    for (let i = 0; i < amount - 1; i++) {
      bulkCost += Math.round((tempPrice *= 1.15));
    }
    return bulkCost;
  }

  generateMenuButton() {
    return `<button onclick="game.updateShop('${this.name}');">${this.name}</button>`;
  }

  generateBuyButtons() {
    let format = game.utilities.formatNumber;
    let html = '<div class="btnBuyGroup">';
    html += `<button onclick="game.buyBuilding('${
      this.name
    }', 1);">Buy x1</br><b>${format(this.cost)}</b></button>`;
    return html;
  }

  generateUpgradeButtons() {
    let html = "";
    let notMet = false;
    this.upgrades.forEach((upgrade) => {
      let format = game.utilities.formatNumber;
      if (upgrade.owned == false) {
        if (upgrade.requirementMet(this.amount)) {
          html += `<button class="upgBtn" onclick="game.buyUpgrade('${
            this.name
          }', '${upgrade.name}')"><b>${upgrade.name}</b></br>${
            upgrade.desc
          }</br><b>${format(upgrade.cost)}</b></button>`;
        } else {
        }
      }
    });
    return html;
  }

  generateShopHTML() {
    let format = game.utilities.formatNumber;
    let singleEffect = this.baseEffect * this.multiplier;
    if (this.specialCPS > 0) {
      singleEffect += this.specialCPS / this.amount;
    }
    let html = `<b>${this.name}</b>
    
    </br>You have <b>${
      this.amount
    }</b> ${this.name.toLowerCase()}(s). Each ${this.name.toLowerCase()} produces <b>${format(
      singleEffect
    )}</b> cookie(s). </br>All of your ${this.name.toLowerCase()}(s) combined produces <b>${format(
      this.effect
    )}</b> cookie(s). ${this.generateBuyButtons()} ${this.generateUpgradeButtons()}
    
    `;
    return html;
  }
}

class Upgrade {
  constructor(name, cost, desc, limit, special = false) {
    this.name = name;
    this.cost = cost;
    this.desc = desc;
    this.limit = limit;
    this.owned = false;
    this.special = special;
  }

  requirementMet(amount) {
    if (amount >= this.limit) {
      return true;
    }
  }
}

class Player {
  constructor() {
    this.cookies = 0;
    this.cookieStats = {
      Earned: 0,
      Spent: 0,
      Clicked: 0,
    };
    this.aMPF = 0;
    this.aMPC = 1;
  }

  earnCookie(amount) {
    this.cookies += amount;
    this.cookieStats.Earned += amount;
  }

  spendCookies(amount) {
    if (this.cookies >= amount) {
      this.cookies -= amount;
      this.cookieStats.Spent += amount;
      return true;
    }
  }

  clickCookie() {
    this.earnCookie(this.aMPC);
    this.cookieStats.Clicked += this.aMPC;
  }
}

let game = {
  settings: {
    frameRate: 30,
    recalculateCPS: true,
    key: "cookieclicker",
  },
  buildings: [
    // Generate all buildings here
    new Building("Cursor", 15, 0.1, [new Upgrade("X1", 100, 1)], false),
    new Building("Grandma", 100, 1, [
      new Upgrade("Forwards from grandma", 1000, 1),
    ]),
    new Building("Farm", 1100, 8, [new Upgrade("Cheap hoes", 11000, 1)]),
    new Building("Mine", 12000, 47, [new Upgrade("Sugar gas", 120000, 1)]),
    new Building("Factory", 130000, 260, [
      new Upgrade("Sturdier conveyor belts", 1300000, 1),
    ]),
    new Building("Factory", 130000, 260, [
      new Upgrade("Sturdier conveyor belts", 1300000, 1),
    ]),
  ],
  utilities: {
    ShortNumbers: [
      "K",
      "M",
      "B",
      "T",
      "Qua",
      "Qui",
      "Sex",
      "Sep",
      "Oct",
      "Non",
      "Dec",
      "Und",
      "Duo",
      "Tre",
      "QuaD",
      "QuiD",
      "SexD",
      "SepD",
      "OctD",
      "NonD",
      "Vig",
    ],
    updateText(className, text) {
      let elements = document.getElementsByClassName(className);
      for (var i in elements) {
        elements[i].innerHTML = text;
      }
    },
    formatNumber(number) {
      let formatted = "";
      if (number >= 1000) {
        for (let i = 0; i < game.utilities.ShortNumbers.length; i++) {
          let divider = Math.pow(10, (i + 1) * 3);
          if (number >= divider) {
            formatted =
              (Math.trunc((number / divider) * 1000) / 1000).toFixed(3) +
              " " +
              game.utilities.ShortNumbers[i];
          }
        }
        return formatted;
      }
      return (Math.trunc(number * 10) / 10).toFixed(1);
    },
    getBuildingByName(name) {
      let correctBuilding = null;
      game.buildings.forEach((building) => {
        if (building.name == name) {
          correctBuilding = building;
          return;
        }
      });
      return correctBuilding;
    },
    getBuildingIndexByName(name) {
      for (let i = 0; i < game.buildings.length - 1; i++) {
        let curBuilding = game.buildings[i];
        if (curBuilding.name == name) {
          return i;
        }
      }
    },
    getBuildingCount() {
      let amount = 0;
      game.buildings.forEach((building) => {
        amount += building.amount;
      });
      return amount;
    },
    stringToBool(string) {
      switch (string) {
        case "true":
          return true;
        case "false":
          return false;
      }
    },
  },
  saving: {
    export() {
      let saveString = "";
      saveString += `${game.player.cookies}|${game.player.cookieStats.Earned}|${game.player.cookieStats.Spent}|${game.player.cookieStats.Clicked}-`;
      let first = true;
      game.buildings.forEach((building) => {
        if (first) {
          first = false;
          saveString += `${building.amount}|${building.locked}|`;
        } else {
          saveString += `#${building.amount}|${building.locked}|`;
        }
        building.upgrades.forEach((upgrade) => {
          saveString += `${upgrade.owned}:`;
        });
        saveString = saveString.slice(0, -1);
      });
      game.saving.saveToCache(premagic(saveString));
      return premagic(saveString);
    },
    import(saveString) {
      saveString = magic(saveString);
      if (saveString != false) {
        saveString = saveString.split("-");
        game.saving.loadPlayer(saveString[0]);
        game.saving.loadBuildings(saveString[1]);
        game.settings.recalculateCPS = true;
        game.updateShop(game.currentShop);
      } else {
        alert(
          "Something wasn't quite right there, unfortunately your save could not be loaded."
        );
      }
    },
    saveToCache(saveString) {
      try {
        return window.localStorage.setItem(game.settings.key, saveString);
      } catch {
        console.log("Problem saving to cache");
      }
    },
    getSaveFromCache() {
      try {
        return window.localStorage.getItem(game.settings.key);
      } catch {
        console.log("Problem loading data from cache, probably doesn't exist");
      }
    },
    loadPlayer(playerData) {
      playerData = playerData.split("|");
      try {
        game.player.cookies = parseFloat(playerData[0]);
        game.player.cookieStats.Earned = parseFloat(playerData[1]);
        game.player.cookieStats.Spent = parseFloat(playerData[2]);
        game.player.cookieStats.Clicked = parseFloat(playerData[3]);
      } catch {
        console.log(
          "Something went wrong whilst loading player data, likely from an older version and not to worry."
        );
      }
    },
    loadBuildings(buildingData) {
      buildingData = buildingData.split("#");
      try {
        for (let i = 0; i < game.buildings.length; i++) {
          let savedBuilding = buildingData[i];
          let nonUpgrade = savedBuilding.split("|");
          let building = game.buildings[i];
          building.amount = parseFloat(nonUpgrade[0]);
          building.setCost();
          building.locked = game.utilities.stringToBool(nonUpgrade[1]);
          let j = 0;
          let upgrades = nonUpgrade[2].split(":");
          building.upgrades.forEach((upgrade) => {
            upgrade.owned = game.utilities.stringToBool(upgrades[j]);
            j++;
          });
        }
      } catch {
        console.log(
          "Something went wrong whilst loading building data, likely from an older version and not to worry."
        );
      }
    },
    wipeSave() {
      if (
        confirm(
          "Are you sure you want to wipe your save? This cannot be reversed!"
        )
      ) {
        game.player.cookies = 0;
        game.player.cookieStats.Earned = 0;
        game.player.cookieStats.Spent = 0;
        game.player.cookieStats.Clicked = 0;
        game.buildings.forEach((building) => {
          if (building.name != "Cursor") {
            building.locked = true;
          }
          building.amount = 0;
          building.effect = 0;
          building.specialCPS = 0;
          building.setCost();
          for (var i in building.upgrades) {
            building.upgrades[i].owned = false;
          }
        });
        game.constructShop();
        game.updateShop("Cursor");
        game.settings.recalculateCPS = true;
      }
    },
    importing: false,
    openBox(type) {
      let container = document.getElementsByClassName("importExportBox")[0];
      let box = document.getElementById("saveBox");
      switch (type) {
        case "import":
          this.importing = true;
          container.style.visibility = "visible";
          box.removeAttribute("readonly");
          box.value = "";
          return;
        case "export":
          let saveString = this.export();
          container.style.visibility = "visible";
          box.value = saveString;
          box.setAttribute("readonly", true);
          return;
      }
    },
    closeBox() {
      document.getElementsByClassName("importExportBox")[0].style.visibility =
        "hidden";
      if (this.importing) {
        let box = document.getElementById("saveBox");
        this.import(box.value);
        box.value = "";
      }
    },
  },
  player: new Player(),
  logic() {
    game.updateDisplays();
    // Only recalculate it when needed, saves on some processing power because this can turn out to be quite a lot of maths.
    if (game.settings.recalculateCPS == true) {
      let CPS = 0;
      game.buildings.forEach((building) => {
        CPS += building.getCPS();
      });
      game.settings.recalculateCPS = false;
      game.player.aMPF = CPS / game.settings.frameRate;
      game.updateShop(game.currentShop);
    }
    if (document.hasFocus()) {
      game.player.earnCookie(game.player.aMPF);
      game.saving.export();
      setTimeout(game.logic, 1000 / game.settings.frameRate);
    } else {
      game.player.earnCookie(game.player.aMPF * game.settings.frameRate);
      game.saving.export();
      setTimeout(game.logic, 1000);
    }
  },
  updateDisplays() {
    // Create temporary shorthand aliases for ease of use.
    let updateText = game.utilities.updateText;
    let format = game.utilities.formatNumber;
    let player = game.player;
    let stats = player.cookieStats;
    document.title = "Cookie Clicker | " + format(player.cookies);
    updateText("cookieDisplay", format(player.cookies));
    updateText("cpcDisplay", format(player.aMPC));
    updateText("cpsDisplay", format(player.aMPF * game.settings.frameRate));
    updateText("earnedDisplay", format(stats.Earned));
    updateText("spentDisplay", format(stats.Spent));
    updateText("clickedDisplay", format(stats.Clicked));
  },
  constructShop() {
    let buildings = game.buildings;
    let finalHtml = "";
    buildings.forEach((building) => {
      finalHtml += building.generateMenuButton();
    });
    game.utilities.updateText("shopList", finalHtml);
  },
  currentShop: "Cursor",
  updateShop(name) {
    game.currentShop = name;
    let finalHtml = "";
    let building = game.utilities.getBuildingByName(name);
    finalHtml += building.generateShopHTML();
    game.utilities.updateText("shop", finalHtml);
  },
  buyBuilding(name, amount) {
    let building = game.utilities.getBuildingByName(name);
    building.buy(amount);
  },
  buyUpgrade(buildingName, upgrade) {
    let building = game.utilities.getBuildingByName(buildingName);
    building.buyUpgrade(upgrade);
  },
  start() {
    // This prevents the user from holding down enter to click the cookie very quickly.
    window.addEventListener("keydown", () => {
      if (event.keyCode == 13 || event.keyCode == 32) {
        event.preventDefault();
        return false;
      }
    });

    // This enables the cookie clicking process.
    document.getElementsByClassName("cookieButton")[0].onclick = () => {
      game.player.clickCookie();
    };

    let localSave = game.saving.getSaveFromCache();
    if (localSave) {
      game.saving.import(localSave);
    } else {
      console.log("No cache save found");
    }

    game.constructShop();
    game.logic();
  },
};

game.start();
