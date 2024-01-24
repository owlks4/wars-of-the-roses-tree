import { useState } from 'react'
import './index.css'

function PersonReact (props) {
    
    let [mouseOver, setMouseOver] = useState(false);

    let styleObj = {display:"flex", flexDirection:"row", left:props.person.xOffset + "%", top:props.person.yOffset + "%", zIndex: (mouseOver ? 2 : 1), fontSize:props.fontSizeEm};

    //evaluate colour
    if (props.curYear >= props.person.born && props.curYear < props.person.died){
        if (props.person.styleOverride != null){
            styleObj["backgroundColor"] = props.person.styleOverride;
            styleObj["color"] = "black"
            styleObj["backgroundImage"] = "inherit";
        }
    }

    
    //render
    return (
    <div id={props.person.personName.toLowerCase().replaceAll(" ","-")}>
        <a target="_blank" rel="noreferrer" href={"https://wikipedia.org/wiki"+props.person.wikipediaUrl}>
        <div className={"person " + props.person.house} onMouseEnter={() => {setMouseOver(true)}} onMouseLeave={() => {setMouseOver(false)}}
        style={styleObj}>
            <div style={{position:"relative",minWidth:"3.2em", backgroundColor:"rgb(20,20,20)"}}>
                <img src={props.person.imgUrl} style={{verticalAlign:"middle", height:"4em", opacity: "0.9"}}/>
            </div>
            <div className="personText">
                {props.person.personName}
                <br/>
                {props.person.born + " - "+props.person.died}
            </div>
            <div className="person-tooltip">{props.person.tooltipText}</div>
        </div>
        </a>
        {
            props.person.father == null && props.person.mother == null ?
            null
            :
            <div>
                <div className="verticalLine" style={{left: props.person.xOffset+"%",top:(props.person.yOffset - (props.person.yOffset - props.person.parentAvgY)/2)+"%",
                                                    height:(props.person.yOffset - props.person.parentAvgY)/2 +"%"}}/>
                {
                    props.person.xOffset - props.person.parentAvgX < 0 ?
                    <div className="horizontalLine" style={{width:(props.person.parentAvgX - props.person.xOffset) +"%", left: props.person.xOffset+"%",
                                                            top:(props.person.yOffset - (props.person.yOffset - props.person.parentAvgY)/2)+"%"}}/>
                    :
                    <div className="horizontalLine" style={{width:(props.person.xOffset - props.person.parentAvgX) +"%", left: props.person.parentAvgX+"%",
                                                            top:(props.person.yOffset - (props.person.yOffset - props.person.parentAvgY)/2)+"%",}}/>
                }
                
                <div className="verticalLine" style={{left: props.person.parentAvgX+"%",top:props.person.parentAvgY+"%",
                                                    height:(props.person.yOffset - props.person.parentAvgY)/2 +"%"}}/>
            </div>
        }    
        {
            props.person.spouses == null || props.person.spouses.length == 0 ? 
            null
            :
            props.person.spousePeople.map((spouse) => spouse.xOffset > props.person.xOffset ? 
                                                            <><div className="horizontalLine"
                                                            style={{width:spouse.xOffset - props.person.xOffset +"%",
                                                            left: props.person.xOffset+"%",
                                                            top:((props.person.yOffset + spouse.yOffset)/2)+"%",}}/></>
                                                            : null)

        }
    </div>
  )
}

export default PersonReact