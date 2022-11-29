/* eslint-disable no-console */
// импорт стандартных библиотек Node.js
const {existsSync, readFileSync, writeFileSync} = require('fs');
const {createServer} = require('http');

// файл для базы данных
const DB = process.env.DB || './db.json';
// номер порта, на котором будет запущен сервер
const PORT = process.env.PORT || 3000;
// префикс URI для всех методов приложения
const URI = '/api/vacancy';

class ApiError extends Error {
  constructor(statusCode, data) {
    super();
    this.statusCode = statusCode;
    this.data = data;
  }
}


function getVacancyList(params = {}) {
  const vacancy = JSON.parse(readFileSync(DB) || '[]');
  if (params.search) {
    const search = params.search.trim().toLowerCase();
    return vacancy.filter(data => [
      data.title.toLowerCase(),
      data.employer.toLowerCase(),
      data.description.toLowerCase(),
      ...data.skills
      ]
        .some(str => str.toLowerCase().includes(search))
    );
  }
  return vacancy;
}

function getStartVacancyList({country, city, search}) {
  if (city) {
    return getVacancyList().filter(item => item.address.toLowerCase() === city.toLowerCase());
  }

  if (country) {
    return getVacancyList().filter(item => item.country.toLowerCase() === country.toLowerCase());
  }

  return getVacancyList({search}).filter(item => item.country.toLowerCase() === 'россия');
}

function getVacancyAddressList(address) {
  if (!address) return getVacancyList();
  const vacancy = JSON.parse(readFileSync(DB) || '[]');
  if (!vacancy) throw new ApiError(404, {message: 'Address Not Found'});
  return vacancy.filter(item => item.address === address);
}

function getVacancy(itemId) {
  const vacancy = getVacancyList().find(({id}) => id === itemId);
  if (!vacancy) throw new ApiError(404, {message: 'Vacancy Not Found'});
  return vacancy;
}

// создаём новый файл с базой данных, если он не существует
if (!existsSync(DB)) writeFileSync(DB, '[]', {encoding: 'utf8'});

// создаём HTTP сервер, переданная функция будет реагировать на все запросы к нему
module.exports = createServer(async (req, res) => {
  // req - объект с информацией о запросе, res - объект для управления отправляемым ответом

  // этот заголовок ответа указывает, что тело ответа будет в JSON формате
  res.setHeader('Content-Type', 'application/json');

  // CORS заголовки ответа для поддержки кросс-доменных запросов из браузера
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // запрос с методом OPTIONS может отправлять браузер автоматически для проверки CORS заголовков
  // в этом случае достаточно ответить с пустым телом и этими заголовками
  if (req.method === 'OPTIONS') {
    // end = закончить формировать ответ и отправить его клиенту
    res.end();
    return;
  }

  // если URI не начинается с нужного префикса - можем сразу отдать 404
  if (!req.url || !req.url.startsWith(URI)) {
    res.statusCode = 404;
    res.end(JSON.stringify({message: 'Not Found'}));
    return;
  }

  let data = null;

  if (req.url.startsWith(URI)) {
    data = req.url.substring(URI.length).split('?');
  }

  const [uri, query] = data;
  const queryParams = {};
  // параметры могут отсутствовать вообще или иметь вид a=b&b=c
  // во втором случае наполняем объект queryParams { a: 'b', b: 'c' }
  if (query) {
    for (const piece of query.split('&')) {
      const [key, value] = piece.split('=');
      queryParams[key] = value ? decodeURIComponent(value) : '';

    }
  }

  try {
    // обрабатываем запрос и формируем тело ответа
    const body = await (async () => {
      if (uri === '' || uri === '/') {
        // /api/vacancy
        if (req.method === 'GET') return getStartVacancyList(queryParams);

      } else {
        // /api/vacancy/{id}
        // параметр {id} из URI запроса
        const itemId = uri.substring(1);
        if (req.method === 'GET') return getVacancy(itemId);
      }
      return null;
    })();
    res.end(JSON.stringify(body));
  } catch (err) {
    // обрабатываем сгенерированную нами же ошибку
    if (err instanceof ApiError) {
      res.writeHead(err.statusCode);
      res.end(JSON.stringify(err.data));
    } else {
      // если что-то пошло не так - пишем об этом в консоль и возвращаем 500 ошибку сервера
      res.statusCode = 500;
      res.end(JSON.stringify({message: 'Server Error'}));
      console.error(err);
    }
  }
})
  // выводим инструкцию, как только сервер запустился...
  .on('listening', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Сервер запущен. Вы можете использовать его по адресу http://localhost:${PORT}`);
      console.log('Нажмите CTRL+C, чтобы остановить сервер');
      console.log('Доступные методы:');
      console.log(`GET ${URI} - получить список вакансий, в query параметр search можно передать поисковый запрос`);
      console.log(`GET ${URI}/{id} - получить вакансию по его ID`);
    }
  })
  // ...и вызываем запуск сервера на указанном порту
  .listen(PORT);
