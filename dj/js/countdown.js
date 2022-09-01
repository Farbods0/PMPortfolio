function CountDown(id, day, time) {

function update(){

    // Get current date and time
    var today = new Date();
  
    // Get number of days to Thursday
    var dayNum = today.getDay();
    var daysToThur = 4 - (dayNum < 4? dayNum : dayNum - 7);
    
    // Get milliseconds to noon Thursday
    var ThursdayNight = new Date(+today);
    ThursdayNight.setDate(ThursdayNight.getDate() + daysToThur);
    ThursdayNight.setHours(20,0,0,0);
    // Round up ms remaining so seconds remaining matches clock
    var ms = Math.ceil((ThursdayNight - today)/1000)*1000;
    var d =  ms / 8.64e7 | 0;
    var h = (ms % 8.64e7) / 3.6e6 | 0;
    var m = (ms % 3.6e6)  / 6e4 | 0;
    var s = (ms % 6e4)    / 1e3 | 0;
        
    d = d<10? "0"+d: d;
    h = h<10? "0"+h: h;
    m = m<10? "0"+m: m;
    s = s<10? "0"+s: s;
    
    // Return remaining 
    return `<div class='clabel'> <p class='countertext'> DAYS </p><h1 class='cnumber days' >${d} </h1></div><div class='clabel'> <p class='countertext'>HOURS</p><h1 class='cnumber hours'>${h}</h1></div><div class='clabel'> <P class='countertext'>MINUTES</P><h1 class='cnumber'>${m}</h1></div><div class='clabel'><P class='countertext'>SECONDS</p><h1 class='cnumber'>${s}</h1></div>`;
  }
  
  // Run update just after next full second
  function runUpdate() {
    var el = document.getElementById('toFriday');
    el.innerHTML = update();
    setTimeout(runUpdate, 1020 - (Date.now()%1000));
  }
  
   runUpdate();
}