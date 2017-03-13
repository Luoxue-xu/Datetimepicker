import Datetimepicker from './datetimepicker';

let datetimepicker = new Datetimepicker({
    el: '[type="date"]',
    lang: 'en'
});

let navbar = document.querySelectorAll('.navbar-collapse a');
let contain = document.querySelector('.container');

Array.from(navbar).map((item) => {
    item.addEventListener('click', function() {
        Array.from(navbar).map((item) => {
            if(item.dataset.type) {
                item.classList.remove('active');
                contain.querySelector(`.${item.dataset.type}`).style.display = 'none';
            }
        });
        this.classList.add('active');
        contain.querySelector(`.${this.dataset.type}`).style.display = 'block';
    }, false);
});
