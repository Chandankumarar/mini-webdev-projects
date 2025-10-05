let userScore = 0;
let compScore = 0;
let user_ScoreP=document.querySelector("#user-score");
let comp_ScoreP=document.querySelector("#comp-score")
let choices = document.querySelectorAll(".choice");
const msg=document.querySelector("#msg")

const genCompChoice = () => {
    const options = ["rock", "paper", "scissors"];
    const randIndx = Math.floor(Math.random() * 3);
    return options[randIndx];
}

const drawgame = () => {
    msg.innerText="Game was Draw.Play again"
    msg.style.backgroundColor = "#081b31";
}

const showWinner=(userWin,userChoice,compChoice)=>{
    if(userWin){
        userScore++;
    msg.innerText =`You win! Your ${userChoice} beats ${compChoice}`;
        msg.style.backgroundColor = "green";
        user_ScoreP.innerText=userScore;
    }
    else{compScore++;
        msg.innerText=`You lost!,Your ${compChoice} beats ${userChoice}`;
        msg.style.backgroundColor = "red";
        comp_ScoreP.innerText=compScore;
    }
}

const playGame = (userChoice) => {
    //Generate computer choice
    const compChoice = genCompChoice();
    if (userChoice === compChoice) { drawgame() }
    else {
        let userWin = true;
        if (userChoice === "rock") {
            //paper,scissors
            userWin = (compChoice === "paper") ? false : true;
        } else if (userChoice === "paper") {
            //rock,scissores
            userWin = (compChoice === "scissors") ? false : true;
        }
        else if (userChoice === "scissors") {
            //paper,rock
            userWin = (compChoice == "rock") ? false : true;
        }
        showWinner(userWin,userChoice,compChoice);
    }

}


choices.forEach((choice) => {
    // console.log(choice);
    choice.addEventListener("click", () => {
        const userChoice = choice.getAttribute("id");
        // console.log("choice was clicked", userChoice);
        playGame(userChoice);
    });
});