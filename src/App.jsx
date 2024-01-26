import { useState, useEffect } from 'react'
import './index.css'
import PersonReact from './PersonReact.jsx';

const DEFAULT_YEAR = 1327;
const SHOW_DEBUG_COORDS_IN_CENTRE = false;
const MIN_YEAR = 1327;
const MAX_YEAR = 1485;
const CANVAS_WIDTH_VW = 95;
const CANVAS_HEIGHT_VW = 130;
let slider = null;

const P2C_HEIGHT_DIFF = 13; //typical parent to child height diff

let positionInLineOfSuccessionCurrentlyUpForGrabs = 0; 

let yearDescriptions = {1327: <>Move the slider to change the year and see the line of<br/>succession juggle between the houses of York and Lancaster.</>,
                        1453: <>In 1453, Henry VI experiences a temporary mental breakdown and cannot rule.<br/>Richard of York manages the country as Protector of the Realm in his stead.</>,
                        1457: <>Despite Henry's recovery, many nobles now believe that Richard of York is the better<br/>leader of the two, and that he has a superior claim to the throne, through his mother.</>,
                        1461: <>In 1461, Henry's forces battle the Yorkists at the Battle of Towton - and lose!<br/>Richard is dead, but his son, Edward IV, takes the throne for the House of York.</>,
                        1470: <>In 1470, Henry returns, exiles Edward IV, and reinstates himself as Henry VI!<br/>But it's short-lived - and Henry is executed for good after the Battle of Tewkesbury.</>,
                        1483: <>In 1483, Edward IV dies, and his son briefly becomes king - before he and his brother<br/>are disinherited due to rumours of illegitimacy, and vanish. Richard III becomes king.</>,
                        1485: <>1485: The Lancastrian Henry Tudor takes on Richard III at the Battle of Bosworth.<br/>He takes the crown by conquest, and cements his position through marriage.</>}

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
    this.issue = [];
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
    this.tooltipText = "N/A";
    this.styleOverride = null;
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

  evaluateCrownPosition(disinherited,curYear){
    
    if (this.mySuccessionPosition != -1){ 
        return disinherited;    //then this person has already been considered in this cycle (which means they already have a better claim than the one that would have been evaluated if we hadn't made this check)
    }

    this.tooltipText = "? not assigned? Is the linkage incorrect?";        
    
    if (curYear < this.born){
        this.tooltipText = "Not yet born";
    }
    else if (this.isCurrentlyDisinherited(curYear) || disinherited){
        disinherited = true;
        if (curYear >= this.died){
          this.tooltipText = "🚫💀";  //just making sure this applies when needed, otherwise there are edge cases
        }
    } else if (curYear >= this.died){
        this.tooltipText = "💀";
    } else {        
        this.mySuccessionPosition = positionInLineOfSuccessionCurrentlyUpForGrabs;
        positionInLineOfSuccessionCurrentlyUpForGrabs++;

        switch (this.mySuccessionPosition){
            case 0:
                this.tooltipText = "👑";
                this.styleOverride = "gold";
            break;
            case 1:
              this.styleOverride = "silver";
            break;
            case 2:
              this.styleOverride = "#cd7f32";
            break;
            default:
              this.styleOverride = null;
            break;
        }

        if (this.mySuccessionPosition != 0){
            this.tooltipText = "#"+this.mySuccessionPosition+" in line";
        }
    }

    if (disinherited && curYear >= this.born && curYear < this.died){       //this is here so that it only applies while alive, otherwise it gets lost in the if...else statement, meaning disinherited dead people end up labelled as disinherited, when really their being dead is more noteworthy
        this.tooltipText = "🚫 disinherited";
    }

    if (this.issue != null){ 
      console.log("looking at issue")
        let malePreferenceIssue = issueWithMalePreferenceOrder(this.issue); //this orders the children so that the boys are prioritised, regardless of whether the girls are older      
        for (let i = 0; i < malePreferenceIssue.length; i++){ 
            let child = getPersonByID(malePreferenceIssue[i]);
            if (child != null) {
                child.evaluateCrownPosition(disinherited,curYear);
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
  "https://upload.wikimedia.org/wikipedia/commons/d/d4/Johnofgaunt.jpg","/John_of_Gaunt"),

  new Person (4,"Edmund of Langley","york",1341,1402,-1,0,null,24,P2C_HEIGHT_DIFF,false,[],
  null,"/Edmund_of_Langley,_1st_Duke_of_York"),

  new Person (5,"Thomas of Woodstock",null,1355,1397,-1,0,null,45,P2C_HEIGHT_DIFF,false,[],
  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/ThomasWoodstock.jpg/555px-ThomasWoodstock.jpg","/Thomas_of_Woodstock,_Duke_of_Gloucester"),

  new Person (6,"Richard II",null,1377,1399,-1,1,null,0,P2C_HEIGHT_DIFF,false,[],
  "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/The_Westminster_Portrait_of_Richard_II_of_England_%281390s%29.jpg/299px-The_Westminster_Portrait_of_Richard_II_of_England_%281390s%29.jpg","/Richard_II_of_England"),

  new Person (7,"Henry IV","lancaster",1367,1413,-1,3,null,-30,P2C_HEIGHT_DIFF,false,[],
  "https://upload.wikimedia.org/wikipedia/commons/2/2c/Illumination_of_Henry_IV_%28cropped%29.jpg","/Henry_IV_of_England"),

  new Person (8,"John Beaufort","lancaster",1373,1410,-1,3,null,-4,P2C_HEIGHT_DIFF,false,[],
  "https://upload.wikimedia.org/wikipedia/commons/b/b0/Effigy_John_Beaufort_1st_Earl_of_Somerset.png","/John_Beaufort,_1st_Earl_of_Somerset"),

  new Person (9,"Thomas Beaufort","lancaster",1377,1426,-1,3,null,8,P2C_HEIGHT_DIFF,false,[],
  null,"/Thomas_Beaufort,_Duke_of_Exeter"),
  
  new Person (10,"Joan Beaufort","lancaster",1379,1440,-1,3,null,20,P2C_HEIGHT_DIFF,true,[],
  null,"/Joan_Beaufort,_Countess_of_Westmorland"),

  new Person (11,"Henry V","lancaster",1386,1422,-1,7,null,-9,P2C_HEIGHT_DIFF,false,[],
  "https://upload.wikimedia.org/wikipedia/commons/a/a7/Henry_V_Miniature.jpg","/Henry_V_of_England"),

  new Person (12,"Humphrey of Lanc.","lancaster",1390,1447,-1,7,null,3,P2C_HEIGHT_DIFF,false,[],
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Gloucester-Talbot-Shrewsbury-Book.jpeg/409px-Gloucester-Talbot-Shrewsbury-Book.jpeg","/Humphrey,_Duke_of_Gloucester"),

  new Person (13,"Henry VI","lancaster",1421,1471,-1,11,null,0,P2C_HEIGHT_DIFF,false,[],
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Henry_VI_of_England%2C_Shrewsbury_book.jpg/417px-Henry_VI_of_England%2C_Shrewsbury_book.jpg","/Henry_VI_of_England"),

  new Person (14,"John Beaufort (Duke of Somerset)","lancaster",1404,1444,-1,8,null,-10,P2C_HEIGHT_DIFF,false,[],
  "https://upload.wikimedia.org/wikipedia/commons/2/24/Effigy_John_Beaufort_1st_Duke_of_Somerset.png","/John_Beaufort,_1st_Duke_of_Somerset"),

  new Person (15,"Richard of Conisbrough","york",1385,1415,-1,4,[33],0,P2C_HEIGHT_DIFF*2,false,[],
  null,"/Richard_of_Conisburgh,_3rd_Earl_of_Cambridge"),

  new Person (31,"Philippa of Clarence",null,1355,1382,-1,2,null,64,P2C_HEIGHT_DIFF*0.75,true,[new PeriodOfDisinheritance(1355,1460),new PeriodOfDisinheritance(1470,1470)],
  null,"/Philippa,_5th_Countess_of_Ulster"),  //see Anne de Mortimer comment below

  new Person (32,"Roger Mortimer",null,1374,1398,-1,31,null,0,P2C_HEIGHT_DIFF*0.62,false,[],
  null,"/Roger_Mortimer,_4th_Earl_of_March"),   //see Anne de Mortimer comment below

  new Person (33,"Anne de Mortimer",null,1388,1411,-1,32,[15],0,P2C_HEIGHT_DIFF*0.62,false,[],
  null,"/Anne_de_Mortimer"), //Anne is out of order because her ID was added later than most, but she needs to be spawned before Richard of York so that he descends from the marriage line rather than from his father alone. Logically she needed her parents spawned too, so they've been moved as well

  new Person (34,"Edmund Tudor","tudor",1430,1456,-1,-1,[17],19,P2C_HEIGHT_DIFF*5.5,false,[],
  null,"/Edmund_Tudor,_1st_Earl_of_Richmond"),

  new Person (16,"Richard of York","york",1411,1460,33,15,null,0,P2C_HEIGHT_DIFF*0.7,false,[],
  null,"/Richard_of_York,_3rd_Duke_of_York"),

  new Person (17,"Margaret Beaufort","lancaster",1443,1509,-1,14,[34],0,P2C_HEIGHT_DIFF*2,true,[],
  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Lady_Margaret_Beaufort_from_NPG.jpg/383px-Lady_Margaret_Beaufort_from_NPG.jpg","/Lady_Margaret_Beaufort"),

  new Person (18,"Henry VII","tudor",1457,1509,34,17,[25],0,P2C_HEIGHT_DIFF,false,[],
  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Enrique_VII_de_Inglaterra%2C_por_un_artista_an%C3%B3nimo.jpg/174px-Enrique_VII_de_Inglaterra%2C_por_un_artista_an%C3%B3nimo.jpg","/Henry_VII_of_England"),

  new Person (19,"Edward IV","york",1442,1483,-1,16,null,-11,P2C_HEIGHT_DIFF*1.3,false,[new PeriodOfDisinheritance(1483,1484)],
  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Edward_IV_Plantagenet.jpg/332px-Edward_IV_Plantagenet.jpg","/Edward_IV_of_England"),

  new Person (20,"Richard III","york",1452,1485,-1,16,null,11,P2C_HEIGHT_DIFF*1.3,false,[],
  "https://upload.wikimedia.org/wikipedia/commons/0/09/Richard_III_earliest_surviving_portrait.jpg","/Richard_III_of_England"),

  new Person (21,"Edward of Westminster","lancaster",1453,1471,-1,13,null,0,P2C_HEIGHT_DIFF,false,[],
  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/EdwardPrinceOfWalesBeauchampPagaent.jpg/479px-EdwardPrinceOfWalesBeauchampPagaent.jpg","/Edward_of_Westminster,_Prince_of_Wales"),

  new Person (22,"Edmund Beaufort","lancaster",1406,1455,-1,8,null,8,P2C_HEIGHT_DIFF,false,[],
  null,"/Edmund_Beaufort,_2nd_Duke_of_Somerset"),

  new Person (23,"Margaret Beaufort, Countess of Stafford","lancaster",1406,1455,-1,22,null,0,P2C_HEIGHT_DIFF,true,[],
  null,"/Margaret_Beaufort,_Countess_of_Stafford"),

  new Person (24,"Duke of Buckingham","york",1455,1483,-1,23,null,0,P2C_HEIGHT_DIFF,false,[],
  null,"/Henry_Stafford,_2nd_Duke_of_Buckingham"),

  new Person (25,"Elizabeth of York","york",1466,1503,-1,19,[18],-10,P2C_HEIGHT_DIFF,true,[],
  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/British_School%2C_16th_century_-_Elizabeth_of_York_-_Haunted_Gallery%2C_Hampton_Court_Palace.jpg/170px-British_School%2C_16th_century_-_Elizabeth_of_York_-_Haunted_Gallery%2C_Hampton_Court_Palace.jpg","/Elizabeth_of_York"),

  new Person (26,"Edward V","york",1470,1483,-1,19,null,0,P2C_HEIGHT_DIFF,false,[],
  "https://upload.wikimedia.org/wikipedia/commons/5/53/King-edward-v.jpg","/Edward_V_of_England"),

  new Person (27,"Richard of Shrewsbury","york",1473,1483,-1,19,null,11,P2C_HEIGHT_DIFF,false,[],
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Richard_of_Shrewsbury%2C_1._Duke_of_York.jpg/185px-Richard_of_Shrewsbury%2C_1._Duke_of_York.jpg","/Richard_of_Shrewsbury,_Duke_of_York"),

  new Person (28,"George, Duke of Clarence","york",1449,1478,-1,16,null,0,P2C_HEIGHT_DIFF*1.3,false,[],
  "https://upload.wikimedia.org/wikipedia/commons/8/8b/George_Plantagenet%2C_Duke_of_Clarence.jpg","/George_Plantagenet,_Duke_of_Clarence"),

  new Person (29,"Henry Beaufort","lancaster",1436,1464,-1,22,null,-12,P2C_HEIGHT_DIFF,false,[],
  null,"/Henry_Beaufort,_3rd_Duke_of_Somerset"),

  new Person (30,"Edmund, 4th Duke of Somerset","lancaster",1438,1471,-1,22,null,13.5,P2C_HEIGHT_DIFF,false,[],
  null,"/Edmund_Beaufort_(died_1471)")
];

for (let i = 0; i < people.length; i++){
  let p = people[i];  
  p.father = getPersonByID(p.fatherID);
  p.mother = getPersonByID(p.motherID);
 
  if (p.father != null){
    p.father.issue.push(p.id);
  }

  if (p.mother != null){
    p.mother.issue.push(p.id);
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

function triggerInheritanceRecalculation(curYear){
  people.forEach((p) => {
    p.mySuccessionPosition = -1;
    positionInLineOfSuccessionCurrentlyUpForGrabs = 0;
  });
  getPersonByID(curYear < 1485 ? 0 : 18).evaluateCrownPosition(false,curYear);
}

function getDescriptionForYear(curYear){

  let output = <></>;

  Object.keys(yearDescriptions).forEach((key) => {
    if (curYear >= parseInt(key)){
      output = yearDescriptions[key];
    }
  });

  return output;
}

function App (props){

  let [fontSizeEm,setFontSizeEm] = useState(window.innerWidth / 152.38);
  let [curYear,setCurYear] = useState(DEFAULT_YEAR);

    useEffect(() => { //Only runs after initial render
      slider = document.getElementById("slider");
      window.addEventListener("resize", (ev) => {setFontSizeEm(window.innerWidth / 152.38)});
    }, []); //ignore intelliense and keep this empty array; it makes this useEffect run only after the very first render, which is intended behaviour

    triggerInheritanceRecalculation(curYear);

    return (
    <>
      <header className="sticky">
        <h2>
          {window.innerWidth > 1000 ? "Interactive Wars of the Roses tree" : "I recommend you use this on PC instead"}    
        </h2>
        <div style={{display:"flex", width:"100%", alignItems:"center", flexDirection:"row"}}>
          <div className='third-width'>

          </div>
          <div className='third-width' id="slider-div" style={{display:"flex", alignItems:"center", flexDirection:"column"}}>
            {curYear}
            <input id="slider" className="onTop" style={{width:"100%", margin:"0.15em 0"}} type="range" min={MIN_YEAR} max={MAX_YEAR} step={1}
              onInput={() => {setCurYear(slider.value);}}/>
          </div>
          <div className='third-width' style={{textAlign:"center", marginTop:"-2.5em"}}>
              {getDescriptionForYear(curYear)}
          </div>
        </div>
      </header>
      <div style={{height:"6em"}}></div>
        <div style={{width:"100%"}}>
              <div id="people" style={{position:'relative', margin:"auto", left:"0em", top:"0em",width:(CANVAS_WIDTH_VW)+"vw",height:(CANVAS_HEIGHT_VW)+"vh"}}>
                {people.map((p) => <><PersonReact person = {p} curYear={curYear} fontSizeEm={fontSizeEm}/></>)}
            </div>
        </div>
    </>
  )
}

export default App