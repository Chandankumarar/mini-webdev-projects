let boxes = document.querySelectorAll('.box');
let resetBtn = document.querySelector('#reset-btn');
let turnO = true;//if X=>true,O=>false
let newGameBtn = document.querySelector("#new-btn");
let msgContainer = document.querySelector(".msg-container");
let msg = document.querySelector("#msg");
const winPatterns = [
    [0, 1, 2], [0, 3, 6], [0, 4, 8], [1, 4, 7], [2, 5, 8], [2, 4, 6], [3, 4, 5], [6, 7, 8]
];
let count=0;
const resetgame=()=>{
    turnO=true;
    enableBoxes();
    msgContainer.classList.add("hide");
};
boxes.forEach((box) => {
    box.addEventListener("click", () => {
        count++;
        if (turnO) { //player O
            box.innerText = "O"; 
            box.style.color="blue";
            turnO = false;
        }
        else {//player X
            box.innerText = "X";
            turnO = true;
            box.style.color="red";
        }
        box.disabled = true;
        checkWinner()
        checkTie();
    });
});
const enableBoxes=()=>{
    for(let box of boxes){
        box.disabled=false;
        box.innerText="";
    }
}
const disableBoxes=()=>{
    count = 0;
    for(let box of boxes){
        box.disabled=true;
        box.innerText="";
    }
}
const showWinner = (winner) => {
        msg.innerText = `Congratulations, Winner is ${winner}`;
    msgContainer.classList.remove("hide");
    disableBoxes();
};
const  checkTie=()=>{
    if(count==9){
        msg.innerText = 'Match is Tie';
    msgContainer.classList.remove("hide");
    // disableBoxes();
    }
}
const checkWinner = () => {
    for (let pattern of winPatterns) {
        let pos1Val = boxes[pattern[0]].innerText;
        let pos2Val = boxes[pattern[1]].innerText;
        let pos3Val = boxes[pattern[2]].innerText;
        console.log('count is '+count)
        if (pos1Val !== "" && pos2Val !== "" && pos3Val !== "") {
            if (pos1Val === pos2Val && pos2Val === pos3Val) {
                showWinner(pos1Val);
            }
        }
    }
}; 
newGameBtn.addEventListener("click",resetgame);
resetBtn.addEventListener("click",resetgame);