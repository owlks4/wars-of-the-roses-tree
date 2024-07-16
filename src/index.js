import './index.css'
import dataJsonUrl from '/data.json?url';
import 'leaflet';
import InheritanceInstance from './InheritanceInstance';

const DEFAULT_YEAR = 1327;
const MIN_YEAR = 1327;
const MAX_YEAR = 1485;
let curYear = DEFAULT_YEAR;

if (window.innerWidth < window.innerHeight){
  document.getElementById("top-bar").style = "flex-direction:column;"
  document.getElementById("year-description").style = "width:100%; margin-top:0;"
}

let people = [];

let slider = document.getElementById("slider");
slider.min = MIN_YEAR;
slider.max = MAX_YEAR;
slider.value = curYear+"";
let yearDescElement = document.getElementById("year-description-text");
let sliderLabel = document.getElementById("slider-label");

slider.oninput = (e) => {
    curYear = e.target.value;
    sliderLabel.textContent = curYear;
    triggerInheritanceRecalculation(curYear);
    yearDescElement.innerHTML = getDescriptionForYear(curYear);
}

let showSuccessionCheckbox = document.getElementById("show-succession-checkbox")
showSuccessionCheckbox.onchange = (e) => {
  let newStyle = e.target.checked ? "display:block;" : "display:none;";
  people.forEach(person => {
    person.tooltipDomElement.style = newStyle;
  });
};

let widthScaleCoefficient = 1.75;

let map = L.map('map', {
  center: [0.67, 0.5*widthScaleCoefficient],
  zoom: 10,
  minZoom: 9.5,
  maxZoom: 10,
  zoomSnap: 0.25,
  zoomDelta:0.25,
  attributionControl: false,
  zoomControl: false,
  crs: L.CRS.Simple  
});

let yearDescriptions = {
  1327: "Move the slider to change the year and see the line of succession juggle between the houses of York and Lancaster.",
	1399: "In 1399, Richard II is deposed by dissatisfied magnates - including Henry Bolingbroke. It is ruled that the crown must pass through a male line - so the throne goes to Henry.",
	1413: "The crown passes to Henry's son, Henry V, who leads England to a famous victory at the battle of Agincourt.",
	1422: "With the premature death of Henry V, the crown passes to his infant son, Henry VI.",
	1432: "This will prove to be a tumultuous reign.",
	1453: "In 1453, Henry VI experiences a temporary mental breakdown and cannot rule. Richard of York manages the country as Protector of the Realm in his stead.",
	1457: "Despite Henry's recovery, many nobles now believe that Richard of York is the better leader of the two, and that he has a superior claim to the throne, through his mother.",
	1461: "In 1461, Henry's forces battle the Yorkists at the Battle of Towton - and lose! Richard is dead, but his son, Edward IV, takes the throne for the House of York.",
	1470: "In 1470, Henry returns, exiles Edward IV, and reinstates himself as Henry VI! But it's short-lived - and Henry is executed for good after the Battle of Tewkesbury.",
	1483: "In 1483, Edward IV dies, and his son briefly becomes king - before he and his brother are disinherited due to rumours of illegitimacy, and vanish. Richard III becomes king.",
	1485: "1485: The Lancastrian Henry Tudor takes on Richard III at the Battle of Bosworth. He takes the crown by conquest, and cements his position through marriage."
}

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
    this.xOffset = json.xOffset;
    this.yOffset = json.yOffset;
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
  
    p.parentAvgX = 0;
    p.parentAvgY = 0;
  
    if (p.father != null && p.mother != null){
      p.parentAvgX = (p.father.xOffset + p.mother.xOffset) / 2;
      p.parentAvgY = (p.father.yOffset + p.mother.yOffset) / 2
    } else if (p.father != null){    
      p.parentAvgX = p.father.xOffset;
      p.parentAvgY = p.father.yOffset;
    } else if (p.mother != null){
      p.parentAvgX = p.mother.xOffset;
      p.parentAvgY = p.mother.yOffset;
    }
  
    p.xOffset += p.parentAvgX;
    p.yOffset += p.parentAvgY;
  }

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
  });
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

function getDescriptionForYear(curYear){

  let output = "";

  Object.keys(yearDescriptions).forEach((key) => {
    if (curYear >= parseInt(key)){
      output = yearDescriptions[key];
    }
  });

  return output;
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
    showSuccessionCheckbox.onchange({target:showSuccessionCheckbox});
  });
};