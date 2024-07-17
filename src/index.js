import './index.css'
import dataJsonUrl from '/data.json?url';
import 'leaflet';
import InheritanceInstance from './InheritanceInstance';

const DEFAULT_YEAR = 1341;
const MIN_YEAR = 1341;
const MAX_YEAR = 1485;
let curYear = DEFAULT_YEAR;

const DEFAULT_WIDTH_BETWEEN_INDIVIDUALS = 10;

let people = [];

let slider = document.getElementById("slider");

if (slider != null){
  slider.min = MIN_YEAR;
  slider.max = MAX_YEAR;
  slider.value = curYear+"";
  let sliderLabel = document.getElementById("slider-label");

  slider.oninput = (e) => {
      curYear = e.target.value;
      sliderLabel.textContent = curYear;
      triggerInheritanceRecalculation(curYear);

      if (curYear < 1400){
        stencil.stencilDiv.className = "left";
      } else {
        stencil.stencilDiv.className = "right";
      }
  }
}

let showSuccessionCheckbox = document.getElementById("show-succession-checkbox")

if (showSuccessionCheckbox != null){
  showSuccessionCheckbox.onchange = (e) => {
    let newStyle = e.target.checked ? "display:block;" : "display:none;";
    people.forEach(person => {
      person.tooltipDomElement.style = newStyle;
    });
  };
}

let widthScaleCoefficient = 1.75;
let connectionDivs = [];

let map = L.map('map', {
  center: [0.67, -0.5],
  zoom: 10,
  minZoom: 9.25,
  maxZoom: 10,
  zoomSnap: 1,
  zoomDelta:0.75,
  attributionControl: false,
  zoomControl: false,
  crs: L.CRS.Simple  
});

map.on("zoomanim", (e)=>{
  let max = 10;
  let min = 8.15; //found empirically, seems to get the connection lines to the intended scale when changing zoom
  let scale = ((e.zoom - min) / (max - min));
  connectionDivs.forEach(div => {
    div.style = "transform:scale("+scale+","+scale+");"
  });
});

function generateRosetteScopeClipPathStyle(radius, center, rotationOffset){
  let output = "clip-path: polygon(evenodd,0vw 0vh,100vw 0vh, 100vw 100vh, 0vw 100vh, 0vw 0vh,";
  let numPoints = 6;
  let firstPointText = null; //so that we can complete the polygon at the end
  let aspectRatio = window.innerWidth /window.innerHeight;
  for (let i = 0; i < numPoints; i++){
    let angle = rotationOffset + (i * ((Math.PI*2) / numPoints));
    let x = center[0] + ((radius[0] * Math.cos(angle)) / aspectRatio);
    let y = center[1] + (radius[1] * Math.sin(angle));
    let text = x +"% "+y+"%";
    output += text+",";
    if (i == 0){
      firstPointText = text;
    }
  }
  return output + firstPointText + ");";
}

let yearDescriptions = 
[
  {
    year:1327,
    title:"Wars of the roses article",
    description:"This is where I'm going to put a series of short articles about key events from the wars of the roses...<br><br>With options at the bottom...<br><br>Maybe even an image in the article body...<br><br>Soon...<br><br>(There is an overhaul underway.)"
  },
  {
  year:1399,
  title:null,
  description:"In 1399, Richard II is deposed by dissatisfied magnates - including Henry Bolingbroke. It is ruled that the crown must pass through a male line - so the throne goes to Henry."
  },
  {
  year:1413,
  title:null,
  description:"The crown passes to Henry's son, Henry V, who leads England to a famous victory at the battle of Agincourt."
  },
  {
  year:1422,
  title:null,
  description:"With the premature death of Henry V, the crown passes to his infant son, Henry VI."
  },
  {
  year:1432,
  title:null,
  description:"This will prove to be a tumultuous reign."
  },
  {
  year:1453,
  title:null,
  description:"In 1453, Henry VI experiences a temporary mental breakdown and cannot rule. Richard of York manages the country as Protector of the Realm in his stead."
  },
  {
  year:1457,
  title:null,
  description:"Despite Henry's recovery, many nobles now believe that Richard of York is the better leader of the two, and that he has a superior claim to the throne, through his mother."
  },
  {
  year:1461,
  title:null,
  description:"In 1461, Henry's forces battle the Yorkists at the Battle of Towton - and lose! Richard is dead, but his son, Edward IV, takes the throne for the House of York."
  },
  {
  year:1470,
  title:null,
  description:"In 1470, Henry returns, exiles Edward IV, and reinstates himself as Henry VI! But it's short-lived - and Henry is executed for good after the Battle of Tewkesbury."
  },
  {
  year:1483,
  title:null,
  description:"In 1483, Edward IV dies, and his son briefly becomes king - before he and his brother are disinherited due to rumours of illegitimacy, and vanish. Richard III becomes king."
  },
  {
  year:1485,
  title:null,
  description:"1485: The Lancastrian Henry Tudor takes on Richard III at the Battle of Bosworth. He takes the crown by conquest, and cements his position through marriage."
  }
]

let ArticleHolder = L.Control.extend({ 
  _container: null,
  options: {position: 'topleft', },

  onAdd: function (map) {
    var div = L.DomUtil.create('div');
    this.article = document.createElement("article");
    this.article.className = "not-shown";
    div.appendChild(this.article);
    this._div = div;
    L.DomEvent.disableClickPropagation(this._div);
    L.DomEvent.disableScrollPropagation(this._div);
    return this._div;
  },

  updateHTML: function (innerHTML){
    this.article.innerHTML = innerHTML;
    this.article.className = "shown";
  }
});

let articleHolder = new ArticleHolder(); //but we don't add it until the start button is pressed

let BlockingBg = L.Control.extend({ 
  _container: null,
  options: {position: 'topleft', },

  onAdd: function (map) {
    var div = L.DomUtil.create('div');
    div.className = "blocking-bg";
    this._div = div;        

    L.DomEvent.disableClickPropagation(this._div);
    L.DomEvent.disableScrollPropagation(this._div);

    return this._div;
  }
});

let blockingBG = new BlockingBg()
blockingBG.addTo(map);

let Stencil = L.Control.extend({ 
  _container: null,
  options: {position: 'topleft', },

  onAdd: function (map) {
    var div = L.DomUtil.create('div');
    let stencil = document.getElementById("stencil-template").content.firstElementChild.cloneNode(true);
    div.appendChild(stencil)
    this._div = div;
    this.stencilDiv = stencil;

    this.stencil0 = findChildElementWithIdRecursive(stencil,"stencil-0")
    this.stencil1 = findChildElementWithIdRecursive(stencil,"stencil-1")
   
    this.startButton = findChildElementWithIdRecursive(stencil,"start-button")

    this.startButton.onclick = () => {
      articleHolder.addTo(map);
      articleHolder.updateHTML(getArticleForYear(curYear))
      MOVE_STENCIL_TO_RIGHT();
      map.removeControl(blockingBG);
      this.startButton.remove();
    };

    //L.DomEvent.disableClickPropagation(this._div);
    //L.DomEvent.disableScrollPropagation(this._div);

    return this._div;
  },

  setStencils: function (style0, style1){
      this.stencil0.style = style0;
      this.stencil1.style = style1;
  }
});

let stencil = new Stencil();
stencil.addTo(map);

function MOVE_STENCIL_TO_START_SCREEN_STATE(){
  stencil.setStencils( //default state.
    generateRosetteScopeClipPathStyle([12,12],[50,45],Math.PI/6),
    generateRosetteScopeClipPathStyle([11.5,11.5],[50,45],Math.PI/6 * 2)
  );
}

function MOVE_STENCIL_TO_LEFT() {
  stencil.setStencils(
    generateRosetteScopeClipPathStyle([70,72],[30,45],65),
    generateRosetteScopeClipPathStyle([70,72],[30,45],95)
  );
}

function MOVE_STENCIL_TO_RIGHT(){
  stencil.setStencils(
    generateRosetteScopeClipPathStyle([70,72],[70,45],15),
    generateRosetteScopeClipPathStyle([70,72],[70,45],45)
  );
}

MOVE_STENCIL_TO_START_SCREEN_STATE();

class Person {
  constructor(json){
    this.id = json.id;
    this.personName = json.personName;
    this.born = json.born;
    this.died = json.died;
    this.motherID = json.motherID;
    this.fatherID = json.fatherID;
    this.spouses = json.spouses;
    this.issue = [];
    this.relativeHorizontalPosition = json.relativeHorizontalPosition;
    this.generation = json.generation;
    this.isFemale = json.isFemale;    
    this.periodsOfDisinheritance = json.periodsOfDisinheritance;
    this.father = null;
    this.mother = null;
    this.spousePeople = null;
    this.house = json.house;
  }

  isCurrentlyDisinherited(curYear){
    if (this.periodsOfDisinheritance == null || this.periodsOfDisinheritance.length == 0){
        return false;
    }

    for (let p of this.periodsOfDisinheritance){
        if (curYear >= p.start && curYear <= p.end){
            return true;
        }
    }
    return false;
  }
}

function preprocessPeople(){

  people.sort((a,b) => {return a.born == b.born ? 0 : (a.born < b.born ? -1 : 1)}); //sorted into birth order so that we can always be sure that children will generate after both of their parents and thus not incur null references by trying to reference them

  for (let i = 0; i < people.length; i++){
    let p = people[i] = new Person(people[i]);

    p.father = getPersonByID(p.fatherID);
    p.mother = getPersonByID(p.motherID);
   
    if (p.father != null){
      p.father.issue.push(getPersonByID(p.id));
    }
  
    if (p.mother != null){
      p.mother.issue.push(getPersonByID(p.id));
    }
  
    if (p.spouses != null){
      p.spousePeople = [];
      for (let s = 0; s < p.spouses.length; s++){
        p.spousePeople.push(getPersonByID(p.spouses[s]));
      }
    }
  
    let parentAvgX = 0;
  
    if (p.father != null && p.mother != null){
      parentAvgX = (p.father.xOffset + p.mother.xOffset) / 2;
    } else if (p.father != null){    
      parentAvgX = p.father.xOffset;
    } else if (p.mother != null){
      parentAvgX = p.mother.xOffset;
    }

    p.xOffset = parentAvgX + (p.relativeHorizontalPosition * DEFAULT_WIDTH_BETWEEN_INDIVIDUALS);
    p.yOffset = p.generation * 15;
  }

 //create a div for each person and add it to the map:

  people.forEach(person => {
      let div = document.getElementById("person-template").content.firstElementChild.cloneNode(true);

      div.className = "person "+person.house;      
      findChildElementWithIdRecursive(div,"person-name").innerHTML = person.personName.replaceAll(", ",",<br>");
      findChildElementWithIdRecursive(div,"person-lifespan").innerText = person.born + " - " + person.died;

      person.domElement = div;
      person.tooltipDomElement = findChildElementWithIdRecursive(div,"person-tooltip");

      L.marker([1-(person.yOffset/100), (person.xOffset/100) * widthScaleCoefficient], {
        icon: L.divIcon({
          html: div
        })
      }).addTo(map);

      person.issue.forEach(child => {
        spawnConnectingDivLineBetweenPeople(person,child);
      });
  });
}

function spawnConnectingDivLineBetweenPeople(person,child){
  let div = document.getElementById("connection-template").content.firstElementChild.cloneNode(true);
  connectionDivs.push(div);

  let horizontalLine = div.children[0];
  let widthCalc = ((person.xOffset-child.xOffset)*150);

  if (widthCalc < 0){
    horizontalLine.className = "horizontalLine reverse";
    widthCalc = Math.abs(widthCalc);
  }
  horizontalLine.style = "width:"+widthCalc+"%;height:"+((child.yOffset-person.yOffset)*50)+"%;";
  
  let position = [1 - ((child.yOffset + person.yOffset)/200), ((child.xOffset)/100) * widthScaleCoefficient]

  let marker = L.marker(position, {
    icon: L.divIcon({
      html: div
    })
  });
  marker.addTo(map);
}

function getPersonByID(id){
  for (let i = 0; i < people.length; i++){
    let p = people[i];
      if (p.id == id){
        return p;
      }
  }
  return null;
}

function triggerInheritanceRecalculation(curYear){
  let originPerson = getPersonByID(curYear < 1485 ? 0 : 18);
  let inheritanceInstance = new InheritanceInstance(people, originPerson, curYear, null);

  let result = inheritanceInstance.process();

  people.forEach(person => {
    let tooltipText = "";
    let displayClass = person.house == null ? "person" : "person "+person.house;
    let inheritancePosition = result.inheritancePositions[person.id];
    switch (inheritancePosition){
        case -4:  //not yet born
          displayClass = "person faded";
          break;
        case -3:  //dead
          tooltipText = "";
          displayClass = "person faded";
          break;
        case -2: //disinherited.
          displayClass = "person faded";
          tooltipText = "<div style='font-size:0.8em;'>🚫</div>";
          break;
        case -1: //they went completely unprocessed... which probably means they don't descend from the current origin point at all.
          displayClass = "person faded";
          break;
        case 0:
          tooltipText = "<div style='font-size:0.6em; transform:translate(0,-90%)'>👑</div>";
          displayClass += " monarch";
          break;
        case 1:
          displayClass += " heir";
          break;
        case 2:
          displayClass += " bronze";
          break;
      }
      if (inheritancePosition > 0){
        tooltipText = result.inheritancePositions[person.id];
      }
      person.domElement.className = displayClass;
      person.tooltipDomElement.innerHTML = tooltipText;
    });
}

function getArticleForYear(curYear){

  let eventObj = null;

  yearDescriptions.forEach((obj) => {
    if (curYear >= obj.year){
      eventObj = obj;
    }
  });

  let html = "<h3>"+eventObj.title+"</h3><p>"+eventObj.description+"</p>";
  return html;
}

function findChildElementWithIdRecursive(node, idToFind){
  if (node.id == idToFind){
      return node;
  }
  for (let i = 0; i < node.children.length; i++){
      let result = findChildElementWithIdRecursive(node.children[i], idToFind)
      if (result != null){
          return result;
      }
  }
  return null;
}

start();

async function start(){
  await fetch(dataJsonUrl).then(async response => {
    people = await response.json();
    preprocessPeople();
    triggerInheritanceRecalculation(curYear);
    if (showSuccessionCheckbox != null){
      showSuccessionCheckbox.onchange({target:showSuccessionCheckbox});
    }    
  });
};