//БЛЯТЬ РУСЯ ИДИ НАХУЙ, ХОРОШО?
let monthIsEnable = false;
function enableMonth() {
    // дезинтыгрирование нахуй всех месяцев
    if (monthIsEnable) {
        let monthsSec = document.getElementById('months');
        let months = monthsSec.querySelectorAll('.MouthInPage');
        months.forEach(month => {
            month.style.display = 'none';
        });
        monthIsEnable = false;
    }

    // Получения выбранногогамумы
    let selectMonth = document.querySelector('#monthChanged').value;
    lastSelectedMonth = selectMonth;
    // Отобразить выбранный месяц
    switch (selectMonth) {
        case "January":
            document.getElementById('MonthJanuary').style.display = 'block';
            break;
        case "February":
            document.getElementById('MonthFebruary').style.display = 'block';
            break;
        case "March":
            document.getElementById('MonthMarch').style.display = 'block';
            break;
        case "April":
            document.getElementById('MonthApril').style.display = 'block';
            break;
        case "May":
            document.getElementById('MonthMay').style.display = 'block';
            break;
        case "June":
            document.getElementById('MonthJune').style.display = 'block';
            break;
        case "July":
            document.getElementById('MonthJuly').style.display = 'block';
            break;
        case "August":
            document.getElementById('MonthAugust').style.display = 'block';
            break;
        case "September":
            document.getElementById('MonthSeptember').style.display = 'block';
            break;
        case "October":
            document.getElementById('MonthOctober').style.display = 'block';
            break;
        case "November":
            document.getElementById('MonthNovember').style.display = 'block';
            break;
        case "December":
            document.getElementById('MonthDecember').style.display = 'block';
            break;
    }
    monthIsEnable = true;
}



function goToTren1(){
    window.location.href = "tren-grud-var1.html";
}
function goToTren2(){
    window.location.href = "tren-grud-var2.html";
}
function goToTrenKard1(){
    window.location.href = "tren-grud-kard.html";
}

