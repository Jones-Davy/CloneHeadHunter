//Выпадающие списки

const optionBtnOrder = document.querySelector('.option__btn_order')
const optionBtnPeriod = document.querySelector('.option__btn_period')
const optionListOrder = document.querySelector('.option__list_order')
const optionListPeriod = document.querySelector('.option__list_period')
const orderBy = document.querySelector('#order_by')
const searchPeriod = document.querySelector('#search_period')

let data

const sortData = () => {
    switch(orderBy.value) {
        case 'down':
            data.sort((a,b) => a.minCompensation > b.minCompensation ? 1 : -1)
            break
        case 'up':
            data.sort((a,b) => b.minCompensation > a.minCompensation ? 1 : -1)
            break

        default:
            data.sort((a,b) => new Date(b.date).getTime() > new Date(a.date).getTime() ? 1 : -1)
    }
}

const filterData = () => {
    const date = new Date()
    date.setDate(date.getDate() - searchPeriod.value)
    return data.filter((item) => new Date(item.date).getTime() > date)
}


const declOfNum = (n, titles) => n + ' ' + titles[n % 10 === 1 && n % 100 !== 11 ?
    0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];

optionBtnOrder.addEventListener('click', (e) => {
    optionListOrder.classList.toggle('option__list_active')
    optionListPeriod.classList.remove('option__list_active')
})

optionBtnPeriod.addEventListener('click', (e) => {
    optionListPeriod.classList.toggle('option__list_active')
    optionListOrder.classList.remove('option__list_active')
})

optionListOrder.addEventListener('click', (e) => {
    const target = e.target

    if(target.classList.contains('option__item')) {
        optionBtnOrder.textContent = target.textContent
        orderBy.value = target.dataset.sort
        sortData()
        renderCards(data)
        optionListOrder.classList.remove('option__list_active')
        for (const elem of optionListOrder.querySelectorAll('.option__item')) {
            if (elem === target) {
                elem.classList.add('option__item_active')

            } else {
                elem.classList.remove('option__item_active')

            }

        }
    }
})

optionListPeriod.addEventListener('click', (e) => {
    const target = e.target

    if(target.classList.contains('option__item')) {
        optionBtnPeriod.textContent = target.textContent
        searchPeriod.value = target.dataset.date
        const tempData = filterData()
        renderCards(tempData)
        optionListPeriod.classList.remove('option__list_active')
    }
    for (const elem of optionListPeriod.querySelectorAll('.option__item')) {
        if(elem === target) {
            elem.classList.add('option__item_active')
        } else {
            elem.classList.remove('option__item_active')
        }
    }
    
})

//Выбор города

const topCityBtn = document.querySelector('.top__city')
const city = document.querySelector('.city')
const cityClose = document.querySelector('.city__close')
const cityRegionList = document.querySelector('.city__region-list')

topCityBtn.addEventListener('click', () => {
    city.classList.toggle('city_active')

})

cityRegionList.addEventListener('click', async (e) => {
    const target = e.target

    if(target.classList.contains('city__link')) {
        const hash = new URL(target.href).hash.substring(1)
        const option = {
            [hash]: target.textContent,
        }
        data = await getData(option)
        sortData()
        renderCards(data)
        topCityBtn.textContent = target.textContent
        city.classList.remove('city_active')
    }
})

//Модальное окно

const overlayVacancy = document.querySelector('.overlay_vacancy')
const resultList = document.querySelector('.result__list')


const createElem = (tag, className, content) => {
    const elem = document.createElement(tag)
    elem.classList.add(className)

    if(content) {
        typeof content === 'string' ?  elem.textContent = content : elem.textContent = String(content)
    }
    return elem
}

const createModal = (data) => {
    const {
        address,
        compensation,
        description,
        employer,
        employment,
        experience,
        skills,
        title,
    } = data

    const modal = createElem('div', 'modal')

    const closeBtn = createElem('button', 'modal__close', '✕')

    const titleModal = createElem('h2', 'modal__title', title)

    const compensationModal = createElem('p', 'modal__compensation', compensation)

    const employerModal = createElem('p', 'modal__employer', employer)

    const addressModal = createElem('p', 'modal__address', address)

    const experienceModal = createElem('p', 'modal__experience', experience)

    const employmentModal = createElem('p', 'modal__employment', employment)

    const descModal = createElem('p', 'modal__description', description)

    const skillsModal = document.createElement('div')
    skillsModal.classList.add('modal__skills', 'skills')

    const skillsTitle = createElem('h2', 'skills__title', 'Подробнее')

    const skillsList = createElem('ul', 'skills__list')

    for(const skill of skills) {
        const skillsItem = createElem('li', 'skills__item', skill)
        skillsList.append(skillsItem)
    }

    skillsModal.append(skillsTitle, skillsList)

    const submitBtn = createElem('button', 'modal__response', 'Отправить резюме')

    modal.append(closeBtn, titleModal, compensationModal, employerModal, addressModal,
                experienceModal, employmentModal, descModal, skillsModal, submitBtn)

    return modal
}


resultList.addEventListener('click', async (e) => {
    e.preventDefault()
    const target = e.target

    if(target.dataset.vacancy) {
        overlayVacancy.classList.add('overlay_active')
        const data = await getData({id: target.dataset.vacancy})
        const modal = createModal(data)
        overlayVacancy.append(modal)
    }
})

overlayVacancy.addEventListener('click', (e) => {
    const target = e.target
    if(target === overlayVacancy || target.classList.contains('modal__close')) {
        overlayVacancy.classList.remove('overlay_active')
        overlayVacancy.querySelector('.modal').remove()
    }
})

cityClose.addEventListener('click', () => {
    city.classList.remove('city_active')
})

//Вывод карточек

const createCard = (vacancy) => {

    const {title, id, compensation, workSchedule, employer, address, description, date} = vacancy

    const card = document.createElement('li')
    card.classList.add('result__item')

    card.insertAdjacentHTML('afterbegin', `
    <article class="vacancy">
    <h2 class="vacancy__title">
      <a class="vacancy__open-modal" href="#" data-vacancy="${id}">${title}</a>
    </h2>
    <p class="vacancy__compensation">${compensation}</p>
    <p class="vacancy__work-schedule">${workSchedule}</p>
    <div class="vacancy__employer">
      <p class="vacancy__employer-title">${employer}</p>
      <p class="vacancy__employer-address">${address}</p>
    </div>
    <p class="vacancy__description">${description}</p>
    <p class="vacancy__date">
      <time datetime="${date}">${date}</time>
    </p>
    <div class="vacancy__wrapper-btn">
      <a class="vacancy__response vacancy__open-modal" href="#" data-vacancy="${id}">Откликнуться</a>
      <button class="vacancy__contacts">Показать контакты</button>
    </div>
  </article>
    `)
    return card;
}

const renderCards = (data) => {
    resultList.textContent = ''
    const cards = data.map(createCard)
    resultList.append(...cards)
    

}

const getData = ({search, id, country, city} = {}) => { 
    let url = `http://localhost:3000/api/vacancy/${id ? id : ''}`
    if (search) {
        url = `http://localhost:3000/api/vacancy?search=${search}`
    }

    if(city) {

        url = `http://localhost:3000/api/vacancy?city=${city}`
    }

    if (country) {
        url = `http://localhost:3000/api/vacancy?country=${country}`

    }
    return fetch(url).then(response => response.json())
}


const formSearch = document.querySelector('.bottom__search')
const found = document.querySelector('.found')


formSearch.addEventListener('submit', async e => {
    e.preventDefault()
    const textSearch = formSearch.search.value
    
    if(textSearch.length > 2) {
        formSearch.search.style.borderColor = ''

        data = await getData({search: textSearch})
        sortData()
        renderCards(data)
        found.innerHTML = `${declOfNum(data.length, ['вакансия', 'вакансии', 'вакансий'])} &laquo;${textSearch}&raquo;`
        formSearch.reset()

    } else {
        formSearch.search.style.borderColor = 'red'
        setTimeout(() => {
            formSearch.search.style.borderColor = ''

        }, 2000);
    }
})


const init = async() => {
    data = await getData()
    sortData()
    data = filterData()
    renderCards(data)

}

init()