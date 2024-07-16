let rules = {
    "MALE_PREFERENCE_PRIMOGENITURE": 
    (orig) => {
        if (orig == null || orig.length == 0){
            return orig;
        }
      
        let issue = [...orig];
      
        issue.sort((a,b)=>{
          if (a.isFemale == b.isFemale){
            return (a.born-b.born);
          } else if (a.isFemale){
            return 1;
          } else {
            return -1;
          }
        });
      
        return issue;
    }
}

class InheritanceInstance {
    constructor(people, originPerson, curYear, rule){
        this.people = people;
        this.originPerson = originPerson;
        this.curYear = curYear;
        this.rule = rule;
    }

    process(){
        let positionInLineOfSuccessionCurrentlyUpForGrabs = 0;

        let inheritancePositions = {};

        this.people.forEach(person => {
            inheritancePositions[person.id] = person.isCurrentlyDisinherited(this.curYear) ? -2 : (this.curYear < person.born ? -4 : -1);
        });
        
        if (this.rule == null){
            this.rule = "MALE_PREFERENCE_PRIMOGENITURE";
        }

        let issueOrderingFunction = rules[this.rule];

        //console.log("Ordering issue according to "+this.rule);
        this.people.forEach(person => {
            person.issue = issueOrderingFunction(person.issue);
        });

        let keepGoing = true;
        let currentPerson = this.originPerson;
        let stack = [];

        while (keepGoing){
            //console.log("Evaluating "+currentPerson.personName)
            
            if (inheritancePositions[currentPerson.id] != -1){ 
                //console.log("This person was already processed"); //then this person has already been considered in this cycle (which also means may they already have a better claim than the one that would have been evaluated if we hadn't aborted reprocessing them via this check)                
            } else if (this.curYear < currentPerson.born){
                inheritancePositions[currentPerson.id] = -4; //they have not yet been born
            }
            else if (currentPerson.isCurrentlyDisinherited(this.curYear) || inheritancePositions[currentPerson.id] == -2){
                inheritancePositions[currentPerson.id] = -2; //they are disinherited
            } else if (this.curYear >= currentPerson.died){
                inheritancePositions[currentPerson.id] = -3; //they are dead
            } else {
                inheritancePositions[currentPerson.id] = positionInLineOfSuccessionCurrentlyUpForGrabs; //they are alive and can accept the inheritance
                //console.log("Granted them inheritance position: "+positionInLineOfSuccessionCurrentlyUpForGrabs)
                positionInLineOfSuccessionCurrentlyUpForGrabs++;
            }

            if (!(inheritancePositions[currentPerson.id] == -4 || currentPerson.issue == null)){ //if this person has been born and has issue to evaluate
                //console.log("Their issue: ")
                //console.log(currentPerson.issue)

                let i = 0;

                while (i < currentPerson.issue.length && inheritancePositions[currentPerson.issue[i].id] != -1){
                    i++;
                }
           
                if (i < currentPerson.issue.length){
                    keepGoing = true;
                    if (inheritancePositions[currentPerson.id] == -2){ //if the parent was disinherited, make sure the child is too
                        inheritancePositions[child.id] = -2;
                    }
                    stack.push(currentPerson);  //put the parent on hold
                    currentPerson = currentPerson.issue[i];  //evaluate this next child        
                    continue;
                } else {
                    //console.log("No more issue to evaluate on this person.")
                }
            }

            if (stack.length > 0){
                currentPerson = stack.pop();
                //console.log("Popped "+currentPerson.personName+" back off the stack")
            } else {
                keepGoing = false;
            }        
        }

        return {
            "inheritancePositions":inheritancePositions
        };
    }
}

export default InheritanceInstance