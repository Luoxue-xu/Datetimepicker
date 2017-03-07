import Datetimepicker from './datetimepicker';

let datetimepicker = new Datetimepicker({
    el: '[type="date"]',
    weekList: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    monthList: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    btns: ['PREV', 'NEXT']
});
