import { useState, useEffect } from 'react'
import './index.css'
import PersonReact from './PersonReact.jsx';

const DEFAULT_YEAR = 1330;
const SHOW_DEBUG_COORDS_IN_CENTRE = false;
const MIN_YEAR = 1330;
const MAX_YEAR = 1485;
const CANVAS_WIDTH_VW = 95;
const CANVAS_HEIGHT_VW = 130;
let slider = null;

const P2C_HEIGHT_DIFF = 12; //typical parent to child height diff

let mouseIsOverPanel = false;
let canvas = null;
let hasDrawnToCanvasForFirstTime = false;

class PeriodOfDisinheritance {
  start = 0;
  end = 0;

  constructor (start,end){
      this.start = start;
      this.end = end;
  }
}

class Person {

  constructor(id,personName,house,born,died,motherID,fatherID,spouses,xOffset,yOffset,isFemale,periodsOfDisinheritance,imgUrl,wikipediaUrl){
    this.id = id;
    this.personName = personName;
    this.born = born;
    this.died = died;
    this.motherID = motherID;
    this.fatherID = fatherID;
    this.spouses = spouses;
    this.xOffset = xOffset;
    this.yOffset = yOffset;
    this.isFemale = isFemale;
    this.periodsOfDisinheritance = periodsOfDisinheritance;
    this.imgUrl = imgUrl;
    this.wikipediaUrl = wikipediaUrl;
    this.father = null;
    this.mother = null;
    this.spousePeople = null;
    this.house = house;
  }

  evaluateMyColour(){         
    if (curYear < this.born){
        this.domElement.style.color = "rgba(0,0,0,0.2)";
        this.domElement.style.background = "#4C1A57";
    } else if (curYear >= this.died){
        this.domElement.style.color = "rgba(0,0,0,0.5)";
        this.domElement.style.background = "dimgrey";
    } else {
        this.domElement.style.color = "black";
        this.domElement.style.background = "skyblue";
    }
}

  isCurrentlyDisinherited(){

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

  evaluateCrownPosition(disinherited){
    if (this.mySuccessionPosition != -1){ 
        return disinherited;    //then this person has already been considered in this cycle (which means they already have a better claim than the one that would have been evaluated if we hadn't made this check)
    }

    this.tooltipDomElement.textContent = "? not assigned? Is the linkage incorrect?";        
    
    if (curYear < this.born){
        this.tooltipDomElement.textContent = "N/A";
    }
    else if (this.isCurrentlyDisinherited() || disinherited){
        disinherited = true;
        if (curYear >= this.died){
            this.tooltipDomElement.textContent = "🚫💀";  //just making sure this applies when needed, otherwise there are edge cases
        }
    } else if (curYear >= this.died){
        this.tooltipDomElement.textContent = "💀";
    } else {        
        this.mySuccessionPosition = positionInLineOfSuccessionCurrentlyUpForGrabs;
        positionInLineOfSuccessionCurrentlyUpForGrabs++;

        switch (this.mySuccessionPosition){
            case 0:
                this.tooltipDomElement.textContent = "👑";
                this.domElement.style.background = "gold";
            break;
            case 1:
                this.domElement.style.background = "silver";
            break;
            case 2:
                this.domElement.style.background = "#cd7f32";
            break;
        }

        if (this.mySuccessionPosition != 0){
            this.tooltipDomElement.textContent = "#"+this.mySuccessionPosition+" in line";
        }
    }

    if (disinherited && curYear >= this.born && curYear < this.died){       //this is here so that it only applies while alive, otherwise it gets lost in the if...else statement, meaning disinherited dead people end up labelled as disinherited, when really their being dead is more noteworthy
        this.tooltipDomElement.textContent = "🚫 disinherited";
    }

    if (this.issue != null){ 
        let malePreferenceIssue = issueWithMalePreferenceOrder(this.issue); //this orders the children so that the boys are prioritised, regardless of whether the girls are older      
        for (let i = 0; i < malePreferenceIssue.length; i++){ 
            let child = getPersonByID(malePreferenceIssue[i]);
            if (child != null) {
                child.evaluateCrownPosition(disinherited);
            }
        }
    }
  }
}

const people = [
  new Person (0,"Edward III",null,1312,1377,-1,-1,null,50,P2C_HEIGHT_DIFF/2,false,[],
  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/King_Edward_III.jpg/459px-King_Edward_III.jpg","/Edward_III_of_England"),
  
  new Person (1,"Edward of Woodstock",null,1330,1376,-1,0,null,-45,P2C_HEIGHT_DIFF,false,[],
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Edward_the_Black_Prince_1430.jpg/450px-Edward_the_Black_Prince_1430.jpg","/Edward_the_Black_Prince"),
  
  new Person (2,"Lionel of Antwerp",null,1338,1368,-1,0,null,-25,P2C_HEIGHT_DIFF,false,[],
  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/LionelDukeOfClarenceAtWestminster.jpg/257px-LionelDukeOfClarenceAtWestminster.jpg","/Lionel_of_Antwerp"),

  new Person (3,"John of Gaunt","lancaster",1340,1399,-1,0,null,-5,P2C_HEIGHT_DIFF,false,[],
  "","/John_of_Gaunt"),

  new Person (4,"Edmund of Langley","york",1341,1402,-1,0,null,22,P2C_HEIGHT_DIFF,false,[]),

  new Person (5,"Thomas of Woodstock",null,1355,1397,-1,0,null,45,P2C_HEIGHT_DIFF,false,[]),

  new Person (6,"Richard II",null,1377,1399,-1,1,null,0,P2C_HEIGHT_DIFF,false,[]),

  new Person (7,"Henry IV","lancaster",1367,1413,-1,3,null,-28,P2C_HEIGHT_DIFF,false,[]),

  new Person (8,"John Beaufort","lancaster",1373,1410,-1,3,null,0,P2C_HEIGHT_DIFF,false,[]),

  new Person (9,"Thomas Beaufort","lancaster",1377,1426,-1,3,null,10,P2C_HEIGHT_DIFF,false,[]),
  
  new Person (10,"Joan Beaufort","lancaster",1379,1440,-1,3,null,20,P2C_HEIGHT_DIFF,true,[]),

  new Person (11,"Henry V","lancaster",1386,1422,-1,7,null,-5,P2C_HEIGHT_DIFF,false,[]),

  new Person (12,"Humphrey of Lanc.","lancaster",1390,1447,-1,7,null,5,P2C_HEIGHT_DIFF,false,[]),

  new Person (13,"Henry VI","lancaster",1421,1471,-1,11,null,0,P2C_HEIGHT_DIFF,false,[]),

  new Person (14,"John Beaufort (Duke of Somerset)","lancaster",1404,1444,-1,8,null,-7,P2C_HEIGHT_DIFF,false,[]),

  new Person (15,"Richard of Conisbrough","york",1385,1415,-1,4,[33],0,P2C_HEIGHT_DIFF*2,false,[]),

  new Person (31,"Philippa of Clarence",null,1355,1382,-1,2,null,63,P2C_HEIGHT_DIFF*0.75,true,[new PeriodOfDisinheritance(1355,1460),new PeriodOfDisinheritance(1470,1470)]),  //see Anne de Mortimer comment below

  new Person (32,"Roger Mortimer",null,1374,1398,-1,31,null,0,P2C_HEIGHT_DIFF*0.62,false,[]),   //see Anne de Mortimer comment below

  new Person (33,"Anne de Mortimer",null,1388,1411,-1,32,[15],0,P2C_HEIGHT_DIFF*0.62,false,[]), //Anne is out of order because her ID was added later than most, but she needs to be spawned before Richard of York so that he descends from the marriage line rather than from his father alone. Logically she needed her parents spawned too, so they've been moved as well

  new Person (16,"Richard of York","york",1411,1460,33,15,null,0,P2C_HEIGHT_DIFF*0.7,false,[]),

  new Person (17,"Margaret Beaufort","lancaster",1443,1509,-1,14,null,-11,P2C_HEIGHT_DIFF,true,[]),

  new Person (18,"Henry VII","tudor",1457,1509,-1,17,[25],0,P2C_HEIGHT_DIFF*2,false,[]),

  new Person (19,"Edward IV","york",1442,1483,-1,16,null,-11,P2C_HEIGHT_DIFF*1.3,false,[new PeriodOfDisinheritance(1483,1484)]),

  new Person (20,"Richard III","york",1452,1485,-1,16,null,11,P2C_HEIGHT_DIFF*1.3,false,[]),

  new Person (21,"Edward of Westminster","lancaster",1453,1471,-1,13,null,0,P2C_HEIGHT_DIFF,false,[]),

  new Person (22,"Edmund Beaufort","lancaster",1406,1455,-1,8,null,5,P2C_HEIGHT_DIFF,false,[]),

  new Person (23,"Margaret Beaufort (Stafford)","lancaster",1406,1455,-1,22,null,0,P2C_HEIGHT_DIFF,true,[]),

  new Person (24,"Duke of Buckingham","york",1455,1483,-1,23,null,0,P2C_HEIGHT_DIFF,false,[]),

  new Person (25,"Elizabeth of York","york",1466,1503,-1,19,[18],-10,P2C_HEIGHT_DIFF,true,[]),

  new Person (26,"Edward V","york",1470,1483,-1,19,null,0,P2C_HEIGHT_DIFF,false,[]),

  new Person (27,"Richard of Shrewsbury","york",1473,1483,-1,19,null,11,P2C_HEIGHT_DIFF,false,[]),

  new Person (28,"George, Duke of Clarence","york",1449,1478,-1,16,null,0,P2C_HEIGHT_DIFF*1.3,false,[]),

  new Person (29,"Henry Beaufort","lancaster",1436,1464,-1,22,null,-12,P2C_HEIGHT_DIFF,false,[]),

  new Person (30,"Edmund, 4th Duke of Somerset","lancaster",1438,1471,-1,22,null,14.3,P2C_HEIGHT_DIFF,false,[])
];

for (let i = 0; i < people.length; i++){
  let p = people[i];  
  p.father = getPersonByID(p.fatherID);
  p.mother = getPersonByID(p.motherID);
 
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

  if (p.id == 1){
    console.log(p.parentAvgX)
    console.log(p.xOffset)
    console.log(p.parentAvgX - p.xOffset);
  }
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

function issueWithMalePreferenceOrder(orig){

  if (orig == null || orig.length == 0){
      return orig;
  }

  let issue = [...orig];

  for (let m = 0; m < issue.length; m++){
      if (getPersonByID(issue[m]).isFemale){ //only consider the m loop for men
          continue;
      }
      for (let f = 0; f < issue.length; f++){
          if (getPersonByID(issue[f]).isFemale && f < m){ //only consider the f loop for women, and only in cases where the women would outrank the man if nothing is changed
              //console.log("It's splicing time because the woman with ID "+issue[f] + " is higher in the succession than a man");
              //console.log("The man in question is " + getPersonByID(issue[m]).name);
              let male = issue.splice(m,1);
              issue.splice(f, 0, male);
          }
      }
  }
  return issue;
}

function App (props){

  let [adjacencies,setAdjacencies] = useState([]);
  let [displayTop,setDisplayTop] = useState(0);
  let [displayLeft,setDisplayLeft] = useState(window.innerWidth > 1000 ? -16 : 0);
  let [mapAdjustLeft,setMapAdjustLeft] = useState("50%");
  let [mapAdjustTop,setMapAdjustTop] = useState("40%");
  let [fontSizeEm,setFontSizeEm] = useState(12.6);
  let [curYear,setCurYear] = useState(DEFAULT_YEAR);

    useEffect(() => { //Only runs after initial render
      tryInitialiseCanvas();
      redrawCanvas();
      slider = document.getElementById("slider");
    }, []); //ignore intelliense and keep this empty array; it makes this useEffect run only after the very first render, which is intended behaviour

    useEffect(() => {   //runs after render all the time, but only actually does anything once. It's required to get the canvas to realise it needs to redraw to display the adjacencies after the (async) territories are rendered
      tryInitialiseCanvas();
    });

    function tryInitialiseCanvas(){
      if (!hasDrawnToCanvasForFirstTime){
        canvas = document.getElementById("canvas");
         if (canvas != null){
            redrawCanvas();
            }
          }
    }

    function redrawCanvas(){
      if (canvas == null){
        return;
      }
      setAdjacencies(adjacencies);
      let ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#505050";
      ctx.lineWidth = 1.5;
    
      for (let i = 0; i < adjacencies.length; i++){
        hasDrawnToCanvasForFirstTime = true;
        let a = adjacencies[i];
        if (a.week != week){
            continue;
          }
        ctx.beginPath();        
        ctx.moveTo((a.x1/100) * canvas.width, (a.y1/100) * canvas.height);
        ctx.bezierCurveTo((a.a1/100) * canvas.width, (a.b1/100) * canvas.height,
                          (a.a2/100) * canvas.width, (a.b2/100) * canvas.height, 
                          (a.x2/100) * canvas.width, (a.y2/100) * canvas.height);
        ctx.stroke();
        }
    }

    tryInitialiseCanvas();

    return (
    <>
      <header>
        <h1>
          {window.innerWidth > 1000 ? "Interactive Wars of the Roses tree" : "I recommend you use this on PC instead"}    
        </h1>
        <h3>
          (Update in progress!)
        </h3>
        <div style={{display:"flex", alignItems:"center", flexDirection:"column"}}>
          {curYear}
          <input id="slider" className="onTop" style={{width:"50em", margin:"auto"}} type="range" min={MIN_YEAR} max={MAX_YEAR} step={1}
            onInput={() => {setCurYear(slider.value)}}/>
        </div>
      </header>
        <div style={{width:"100%"}}>
              <div id="people" style={{position:'relative', margin:"auto", left:"0em", top:"0em",width:(CANVAS_WIDTH_VW)+"vw",height:(CANVAS_HEIGHT_VW)+"vh"}}>
                {people.map((p) => <><PersonReact person = {p} curYear={curYear} fontSizeEm={fontSizeEm}/></>)}
                <canvas style={{width:"100%", height:"100%"}}/>
            </div>
        </div>
    </>
  )
}

export default App