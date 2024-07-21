import './index.css'
import dataJsonUrl from '/data.json?url';
import 'leaflet';
import InheritanceInstance from './InheritanceInstance';

const DEFAULT_YEAR = 1341;
const MIN_YEAR = 1341;
const MAX_YEAR = 1485;

const DEFAULT_WIDTH_BETWEEN_INDIVIDUALS = 10;

let people = [];

let canvas = document.createElement("canvas");
canvas.width = 1920;
canvas.height = 1080;
let boundsForCanvas = null;

let imageOverlay = null;

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

let map = L.map('map', {
  center: [0.625, -0.7],
  zoom: 9.25,
  minZoom: 8.5,
  maxZoom: 10,
  zoomSnap: 1,
  zoomDelta:0.75,
  attributionControl: false,
  zoomControl: false,
  crs: L.CRS.Simple  
});

map.on("zoomstart", (e)=>{
  window.onresize();
});

function generateRosetteScopeClipPathStyle(radius, center, rotationOffset){

  if (window.innerWidth > window.innerHeight){
    radius[0] *= (window.innerWidth/window.innerHeight) / (1920/1080);
    radius[1] *= (window.innerWidth/window.innerHeight) / (1920/1080);
  } else {

  }
  

  let output = "clip-path: polygon(evenodd,0vw 0vh,100vw 0vh, 100vw 100vh, 0vw 100vh, 0vw 0vh,";
  let numPoints = 6;
  let firstPointText = null; //so that we can complete the polygon at the end
  let aspectRatio = window.innerWidth / window.innerHeight;
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
    focus: [1,20,33],
    year:1341,
    title:"The Wars of the Roses",
    description:"Welcome to the new-look Wars of the Roses tree!<br><br>This page is a dynamic history of the various wars between the houses of York and Lancaster, all the way from Edward III's succession to Henry Tudor's victory at the Battle of Bosworth.<br><br>(Also, yes - I know it's in doubt as to whether the Lancastrians really used a red rose as their emblem - but for the purposes of this tree, it makes for a useful visual shorthand.)",    
  },
  {
    focus: [1,2,3,4],
    year:1342,
    title:"The succession of Edward III",
    description:"This seems like standard fare - the heir to the throne is the king's eldest son, Edward of Woodstock.<br><br>(Well, because Edward of Woodstock dies early, the crown ends up going to his son, Richard - but that's still par for the course.)<br><br>But unfortunately for Richard, the other branches of the tree will soon pose a problem...",
  },
  {
  focus: [11,33],
  year:1399,
  title:"Richard II is forced out",
  description:"In 1399, Richard II is deposed by dissatisfied magnates - including Henry Bolingbroke.<br><br>Ordinarily, Richard's heir would be the next most senior descendant of Edward III, via the Lionel of Antwerp branch.<br><br>But Henry has other ideas, and claims that the crown cannot pass through that line.<br><br>Conveniently, this also makes him Henry IV.<br><br>"
  },
  {
  focus: [11,17,33],
  year:1421,
  title:"Victory in France",
  description:"The crown passes to Henry's son, Henry V, who leads England to a famous victory at the battle of Agincourt.<br><br>But all too soon, his premature death will cause his infant son to inherit the throne instead.<br><br>This will prove to be a tumultuous reign."
  },
  {
  focus: [18,21,33],
  year:1453,
  title:"A critical moment for<br>the House of York",
  description:"Henry VI, now an adult, experiences a temporary mental breakdown in 1453 and cannot rule. Richard of York, his distant cousin, manages the country as Protector of the Realm in his stead.<br><br>In time, Henry recovers - but many nobles now believe that Richard is the better leader of the two, and that he has a superior claim to the throne, through his mother.<br><br>He's a descendant of the branch that had to be disinherited to allow Henry IV to take the throne in the first place, and is therefore, he argues, the rightful heir!"
  },
  {
  year:1461,
  title:"The House of York takes control",
  description:"The hostilities show no sign of stopping. In 1461, King Henry's forces battle the Yorkists at the Battle of Towton.<br><br>And in a surprise twist, Henry loses!<br><br>Richard of York is dead, but his son, Edward IV, takes the throne for the House of York."
  },
  {
  focus: [18,21,33],
  year:1470,
  title:"Henry strikes back",
  description:"But the House of York have made a critical mistake: they allowed Henry to escape alive, and for the next nine years, he plots against them.<br><br>In 1470, he returns, exiles Edward IV, and reinstates himself as Henry VI!<br><br>But it's short-lived - and this time, the Yorkists make sure to have Henry executed after the Battle of Tewkesbury."
  },
  {
  focus: [20,27],
  year:1482,
  title:"The Princes in the Tower",
  description:"The House of York enjoys over a decade of relative peace.<br><br>King Edward IV dies in 1483, and his son, also called Edward, is briefly king - before he and his siblings are swiftly disinherited.<br><br>Within a few months, the young Edward and his brother Richard have vanished.<br><br>Accusations of murder have been flung at various people over the centuries, but all we know for sure is that the immediate beneficiary of the illegitimacy ruling was their uncle, Richard III, who became king."
  },
  {
  focus: [18,21,33],
  year:1484,
  title:"Tudors, at last",
  description:"You might be wondering why we've been displaying the middle branch of the tree all this time.<br><br>It's because Henry Tudor, Earl of Richmond, hails from this branch, and is now the champion of the Lancastrian cause.<br><br>He begins rallying troops to fight Richard III."
  },
  {
  focus: [18,20,25,34],
  year:1485,
  title:"The Battle of Bosworth",
  description:"Sometimes, it feels as though this war is just endless fighting between various Richards and Henrys.<br><br>Henry Tudor defeats Richard III at the Battle of Bosworth, and famously unites the two houses through his marriage to Richard's niece, Elizabeth of York.<br><br>Richard is buried at Greyfriars, Leicester - the future site of one very famous car park."
  }
]

yearDescriptions.sort((a,b) => {a.year == b.year ? 0 : a.year > b.year ? 1 : -1})

let ArticleHolder = L.Control.extend({ 
  _container: null,
  options: {position: 'topleft', },

  onAdd: function (map) {
    var div = L.DomUtil.create('div');
    this.article = document.createElement("article");
    this.article.style = "font-size:"+(window.innerWidth / 960)+"em;" + (window.innerWidth < window.innerHeight ? "padding-bottom:2em;" : "");
    this.article.className = "not-shown";
    div.appendChild(this.article);
    this._div = div;
    L.DomEvent.disableClickPropagation(this._div);
    L.DomEvent.disableScrollPropagation(this._div);
    return this._div;
  },

  updateHTML: function (newChildElement){    
    this.article.innerHTML = "";
    this.article.append(newChildElement);
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
      refreshInfoBox(DEFAULT_YEAR);
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

  hasAtLeastOneLivingSibling(year){

    if (this.father != null && this.father.issue != null){
      for (let i = 0; i < this.father.issue.length; i++){
        let child = this.father.issue[i];
        if (child != this && child.isAliveInYear(year)){
          return true;
        }
      }  
    }

    if (this.mother != null && this.mother.issue != null){
      for (let i = 0; i < this.mother.issue.length; i++){
        let child = this.mother.issue[i];
        if (child != this && child.isAliveInYear(year)){
          return true;
        }
      }  
    }

    return false;
  }

  isAliveInYear(year){
    if (year < this.born || year >= this.died){
      return false;
    }
    return true;
  }

  isCurrentlyDisinherited(year){
    if (this.periodsOfDisinheritance == null || this.periodsOfDisinheritance.length == 0){
        return false;
    }

    for (let p of this.periodsOfDisinheritance){
        if (year >= p.start && year <= p.end){
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
      p.parentAvgY = (p.father.yOffset + p.mother.yOffset) / 2;
    } else if (p.father != null){    
      p.parentAvgX = p.father.xOffset;
      p.parentAvgY = p.father.yOffset;
    } else if (p.mother != null){
      p.parentAvgX = p.mother.xOffset;
      p.parentAvgY = p.mother.yOffset;
    }

    p.xOffset = p.parentAvgX + (p.relativeHorizontalPosition * DEFAULT_WIDTH_BETWEEN_INDIVIDUALS);
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

      person.marker = L.marker([1-(person.yOffset/100), (person.xOffset/100) * widthScaleCoefficient], {
        icon: L.divIcon({
          html: div
        })
      });
      
      person.marker.addTo(map);
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

function triggerInheritanceRecalculation(year){
  let originPerson = getPersonByID(year < 1485 ? 0 : 18);
  let inheritanceInstance = new InheritanceInstance(people, originPerson, year, null);

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
          if (!person.isAliveInYear(year)){
            displayClass = "person faded";
          } else {
            displayClass = "person";
          }          
          tooltipText = "<div style='font-size:0.8em;'>🚫</div>";
          break;
        case -1: //they went completely unprocessed... which probably means they don't descend from the current origin point at all.
          if (!person.isAliveInYear(year)){
            displayClass = "person faded";
          } else {
            displayClass = "person";
          }    
          break;
        case 0:
          tooltipText = "<div style='font-size:0.6em; transform:translate(0,-90%)'>👑</div>";
          displayClass += " monarch";
          break;
        case 1:
          displayClass += " heir";
          break;
      }
      if (inheritancePosition > 0){
        tooltipText = result.inheritancePositions[person.id];
      }
      person.domElement.className = displayClass;
      person.tooltipDomElement.innerHTML = tooltipText;
    });
    redrawCanvas(year);
}

function refreshInfoBox(year){
  articleHolder.updateHTML(getArticleForYear(year))
  triggerInheritanceRecalculation(year);  
  MOVE_STENCIL_TO_RIGHT();
}

function getArticleForYear(year){

  let eventObj = null;
  let indexOfEventObj = 0;

  console.log("Getting article for year:"+year)

  yearDescriptions.forEach((obj, index) => {
    if (year >= obj.year){
      eventObj = obj;
      indexOfEventObj = index;
    }
  });

  let div = document.createElement("div");
  let h3 = document.createElement("h3");
  h3.innerHTML = eventObj.title;
  let p = document.createElement("p");
  p.innerHTML = eventObj.description;

  if (window.innerWidth < window.innerHeight){
    p.style =  "min-height:unset;";
  }

  div.appendChild(h3);
  div.appendChild(p);
  let buttonsDiv = document.createElement("div");
  buttonsDiv.className = "buttons-div"

  let backButton = document.createElement("button");
  backButton.innerText = "Back";

  if (indexOfEventObj > 0){
    backButton.onclick = () => {
      let targetYear = yearDescriptions[indexOfEventObj - 1].year;
      year = targetYear;
      refreshInfoBox(year);
    };
  } else {
    backButton.style = "opacity:0.3;"
  }
  buttonsDiv.appendChild(backButton)

  let nextButton = document.createElement("button");
  nextButton.innerText = "Next";

  if (indexOfEventObj < yearDescriptions.length - 1){
    nextButton.onclick = () => {
      let targetYear = yearDescriptions[indexOfEventObj + 1].year;
      year = targetYear;
      refreshInfoBox(year);
    };
  } else {
    nextButton.style = "opacity:0.3;"
  }
  buttonsDiv.appendChild(nextButton);

  div.appendChild(buttonsDiv);
  zoomToShowIndividuals(eventObj.focus)
  return div;
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

function toCanvasCoords(position){
  let pos = [(((((position[0]/100)) * canvas.width)) + canvas.width/2), (((position[1]/100)) * canvas.height * (canvas.height/1000))];
  if (pos[0] > canvas.width - 2){
    pos[0] = canvas.width-2;
  } else if (pos[0] < 2){
    pos[0] = 1;
  }
  return pos;
}

function redrawCanvas(year){
  if (canvas == null || boundsForCanvas == null){
    return;
  }

  let ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 2;
 
  people.forEach(person => {
    let coords = [0,0];

    if (!person.isAliveInYear(year)){
      ctx.strokeStyle = "rgba(60,60,60,0.1)";
    } else {
      ctx.strokeStyle = "rgb(60,60,60)";
    }

    if (person.father != null || person.mother != null){
      ctx.beginPath();
      let bothParentsExist = person.father != null && person.mother != null;
      let keyParent = person.father == null ? person.mother : person.father;
      if (keyParent.issue.indexOf(person) == 0){ //only draw the line straight into the parent if nobody else has drawn it yet, AND make it transparent if the parent is dead
        let originalStrokeStyle = ctx.strokeStyle;
        if (year >= keyParent.died){
          ctx.strokeStyle = "rgba(60,60,60,0.1)";
        }
        coords = toCanvasCoords([person.parentAvgX, person.parentAvgY + (bothParentsExist ? DEFAULT_WIDTH_BETWEEN_INDIVIDUALS/5 : DEFAULT_WIDTH_BETWEEN_INDIVIDUALS/2.2)]);
        ctx.moveTo(coords[0],coords[1]);
        coords = toCanvasCoords([person.parentAvgX, (person.yOffset + person.parentAvgY) / 2]);
        ctx.lineTo(coords[0],coords[1]);
        ctx.stroke();
        ctx.strokeStyle = originalStrokeStyle;
      }
      if (person.hasAtLeastOneLivingSibling(year) || (person.father != null && person.father.isAliveInYear(year)) || (person.mother != null && person.mother.isAliveInYear(year))){ //and there is at least one living sibling or parent
        ctx.beginPath();
        coords = toCanvasCoords([person.parentAvgX, (person.yOffset + person.parentAvgY) / 2]);
        ctx.moveTo(coords[0],coords[1]);
        coords = toCanvasCoords([person.xOffset, (person.yOffset + person.parentAvgY) / 2]);
        ctx.lineTo(coords[0],coords[1]);
        coords = toCanvasCoords([person.xOffset, person.yOffset - (DEFAULT_WIDTH_BETWEEN_INDIVIDUALS/2.2)]);
        ctx.lineTo(coords[0],coords[1]);
        ctx.stroke();
      }
    }
  });

  let oldImageOverlay = imageOverlay;
  
  imageOverlay = L.imageOverlay(canvas.toDataURL(), boundsForCanvas, {}).addTo(map);

  if (oldImageOverlay != null){
    map.removeLayer(oldImageOverlay);
  }
}

function zoomToShowIndividuals(individuals){

  if (individuals == null || individuals.length == 0){
    return;
  }

  let markers = [];

  individuals.forEach(personID => {
    markers.push(getPersonByID(personID).marker);
  })

  let group = new L.featureGroup(markers);
  let bounds = group.getBounds();
  let faraway = bounds.getSouthWest()

  let horizontalViewOffset = 1.15;

  if (window.innerWidth < window.innerHeight && window.matchMedia("(orientation: portrait)").matches){ //mobile portrait mode
    horizontalViewOffset = 0;
  }

  bounds = bounds.extend([faraway.lat,faraway.lng - horizontalViewOffset]); //arbitrarily extends the bounds so that the zoom instead goes off-centre within the window (so that we can see the result through the rosette window)
  map.flyToBounds(bounds, {duration:1});
}

window.onresize = ()=>{ //pc
  if (window.innerWidth > window.innerHeight){
    articleHolder.article.style = "font-size:"+(window.innerWidth / 960)+"em; padding-left:"+((window.innerWidth / 1920) * 7.5)+"vw";
    people.forEach(person => {
      person.domElement.style = "font-size:"+((window.innerWidth/1920)*0.925)+"em;";
    });
  } else { //mobile
    articleHolder.article.style = "background-color:white;font-size:"+(window.innerWidth / 360)+"em; padding:1em; width:100vw;max-width:unset;box-sizing:border-box;";
    people.forEach(person => {
      person.domElement.style = "font-size:"+((window.innerWidth/480)*0.925)+"em;";
    });
  }
}

start();

async function start(){
  await fetch(dataJsonUrl).then(async response => {
    people = await response.json();
    preprocessPeople();  
    triggerInheritanceRecalculation(DEFAULT_YEAR);
    if (showSuccessionCheckbox != null){
      showSuccessionCheckbox.onchange({target:showSuccessionCheckbox});
    }

    let highestAbsX = 0;
    let highestAbsY = 0;

    people.forEach((person) => {
        if (Math.abs(person.xOffset * widthScaleCoefficient) > highestAbsX){
          highestAbsX =  Math.abs(person.xOffset * widthScaleCoefficient);
        }
        if (Math.abs(person.yOffset) > highestAbsY){
          highestAbsY = Math.abs(person.yOffset);
        }
    });
    boundsForCanvas = [[1,-highestAbsX/100],[1-(highestAbsY/100),highestAbsX/100]]
    redrawCanvas(DEFAULT_YEAR);
  });
};