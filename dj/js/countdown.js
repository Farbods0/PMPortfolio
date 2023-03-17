async function CountDown(id, day, time) {
  const clientId = '5lwetyy2p80wrzka5rirlx2udd9h9n';
  let token;
  let dataTwitch;

  function update() {
    // Get current date and time
    var todayLocal = new Date();
    var todayPst = new Date(todayLocal.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles"
    }));

    // Get number of days to Thursday
    var dayNum = todayPst.getDay();
    var daysToThur = 4 - (dayNum < 4 ? dayNum : dayNum - 7);

    // Get milliseconds to noon Thursday
    var ThursdayNight = new Date(+todayPst);
    ThursdayNight.setDate(ThursdayNight.getDate() + daysToThur);
    ThursdayNight.setHours(20, 0, 0, 0);
    // Round up ms remaining so seconds remaining matches clock
    var ms = Math.ceil((ThursdayNight - todayPst) / 1000) * 1000;
    var d = ms / 8.64e7 | 0;
    var h = (ms % 8.64e7) / 3.6e6 | 0;
    var m = (ms % 3.6e6) / 6e4 | 0;
    var s = (ms % 6e4) / 1e3 | 0;

    d = d < 10 ? "0" + d : d;
    h = h < 10 ? "0" + h : h;
    m = m < 10 ? "0" + m : m;
    s = s < 10 ? "0" + s : s;

    // Return remaining 
    return `<div class='clabel'> <p class='countertext'> DAYS </p><h1 class='cnumber days' >${d} </h1></div><div class='clabel'> <p class='countertext'>HOURS</p><h1 class='cnumber hours'>${h}</h1></div><div class='clabel'> <P class='countertext'>MINUTES</P><h1 class='cnumber'>${m}</h1></div><div class='clabel'><P class='countertext'>SECONDS</p><h1 class='cnumber'>${s}</h1></div>`;
  }

  // Run update just after next full second
  async function runUpdate() {
    var title = document.getElementById('live-stream-title');
    var livestreamButton = document.getElementById('livestream');
    var el = document.getElementById('toFriday');
    if (dataTwitch && dataTwitch.length > 0) {
      title.innerHTML = "WE ARE NOW LIVE";
      el.classList.add('justify-content-center');
      livestreamButton.classList.add('mt-5');
      el.innerHTML = '<iframe src="https://player.twitch.tv/?channel=fjahan&parent=www.farbodjahan.com" frameborder="0" allowfullscreen="true" scrolling="no" height="378" width="620"></iframe>'
    } else {
      title.innerHTML = "NEXT LIVE STREAM";
      el.innerHTML = update();
      setTimeout(runUpdate, 1020 - (Date.now() % 1000));
    }
  }

  async function fetchTwitchToken() {
    var body = {
      'client_id': clientId,
      'client_secret': 'f8xmnttagea745m8dyi5v25auqdfpf',
      'grant_type': 'client_credentials',
    };

    var formBody = [];
    for (var property in body) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(body[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");

    var res = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: formBody,
    });
    var resJson = await res.json();
    if (res.status === 200 && resJson.access_token) {
      token = resJson.access_token
    }
  }

  async function fetchTwitchLive() {
    var res = await fetch('https://api.twitch.tv/helix/streams?user_login=fjahan', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': clientId,
      },
    });
    var resJson = await res.json();
    if (res.status === 200) {
      dataTwitch = resJson.data;
      if (dataTwitch && dataTwitch.length === 0) {
        runUpdate()
      }
    }
    if (res.status === 401) {
      await fetchTwitchToken();
      await fetchTwitchLive();
    }
  }

  await fetchTwitchToken();
  await fetchTwitchLive();
  setInterval(fetchTwitchLive, 1000);
  runUpdate();
}