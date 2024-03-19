'use-strict';

// Initialization
let baseUrl = new URL('https://serpapi.com/search?');
let proxyUrl = new URL('https://corsproxy.io/?');
const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");
const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow"
};

// Elements
const searchContainer = document.querySelector('.search--container');
const searchInput = document.querySelector('#search--input');
const searchForm = document.querySelector('.search--form');
const resultsContainer = document.querySelector('.results--container');
const resultsTable = document.querySelector('.results--table');
const resultsForm = document.querySelector('.results--form');
const resultsInput = document.querySelector('#results--input');
const pagination = document.querySelector('.pagination');
const loaderContainer = document.querySelector('.loader--container');
const loader = document.querySelector('.loader');
const paginationLinks = document.querySelector('.pagination--links');
const previousLink = document.querySelector('.previous--link');
const nextLink = document.querySelector('.next--link');
const errorContainer = document.querySelector('.error--container');

// Selectors
searchForm.addEventListener('submit', function(e) {
  e.preventDefault();
  resultsInput.value = searchInput.value;
  searchContainer.classList.add('hide');
  resultsContainer.classList.remove('hide');
  loaderContainer.classList.remove('hide');
  fetchResults(searchInput.value);
});

resultsForm.addEventListener('submit', function(e) {
  e.preventDefault();
  resultsInput.blur();
  errorContainer.innerHTML = null;
  resultsTable.innerHTML = null;
  loaderContainer.classList.remove('hide');
  clearPagination();
  fetchResults(resultsInput.value);
});

// Methods
function fetchResults(search) {
  let queryParams = search.padStart(search.length + 2, 'q=').concat(`&engine=google_local&api_key=${config.apiKey}`)
  const url = proxyUrl + baseUrl.toString().concat(queryParams);

  fetch(`${url}`, requestOptions)
    .then((response) => response.json())
    .then((result) => {
      if(result.error) {
        displayError(result)
      } else {
        buildHtml(result);
      }
    })
    .catch((error) => displayError(error));
}

function fetchPage(e) {
  e.preventDefault();
  const url = proxyUrl + e.target.href.concat(`&api_key=${config.apiKey}`);
  resultsTable.innerHTML = null;
  loaderContainer.classList.remove('hide');
  clearPagination();

  fetch(`${url}`, requestOptions)
    .then((response) => response.json())
    .then((result) => {
      if(result.error) {
        displayError(result)
      } else {
        buildHtml(result);
      }
    })
    .catch((error) => displayError(error));
}

function clearPagination() {
  paginationLinks.innerHTML = null;
  previousLink.innerHTML = null;
  nextLink.innerHTML = null;
  pagination.classList.remove('flex');
  pagination.classList.add('hide');
}

function displayError(error) {
  const html = `
    <div class="text-center">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mx-auto h-16 w-16 text-gray-500">
        <path stroke-linecap="round" stroke-linejoin="round"
        d="M3 8.25V18a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 18V8.25m-18 0V6a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25
          0 0 1 21 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6ZM7.5 6h.008v.008H7.5V6Zm2.25 0h.008v.008H9.75V6Z" />
      </svg>
      <h3 class="mt-2 text-sm text-gray-900">${error.error.slice(0, -1)} - <spam class="font-semibold text-gray-900">${error.search_parameters.q}</span></h3>
      <p class="mt-1 text-sm text-gray-500">Try a new search to find what you're looking for.</p>
    </div>
  `
  loaderContainer.classList.add('hide');
  pagination.classList.remove('flex');
  errorContainer.classList.remove('hide');
  errorContainer.insertAdjacentHTML('afterbegin', html);
}

function buildHtml(response) {
  response.local_results.forEach((res) => {
    const html = `
      <li class="overflow-hidden rounded-xl border border-gray-200">
        <div class="flex items-center gap-x-4 border-b border-gray-900/5 bg-gray-50 p-6">
          <img src="${res.thumbnail}" class="h-14 w-14 flex-none rounded-lg bg-white object-cover ring-1 ring-gray-900/10">
          <div class="text-sm font-medium leading-6 text-gray-900">${res.title || 'N/A'}</div>
        </div>
        <dl class="-my-3 divide-y divide-gray-100 px-6 py-4 text-sm leading-6">
          <div class="flex justify-between gap-x-4 py-3">
            <dt class="text-gray-500">Ratings</dt>
            <dd class="flex items-start gap-x-2">
              <div class="font-medium text-gray-900">${res.reviews_original || (0)}</div>
              <div class="rounded-md py-1 px-2 text-xs font-medium ring-1 ring-inset text-green-700 bg-green-50
                ring-green-600/10">${res.rating || 0}</div>
            </dd>
          </div>
          <div class="flex justify-between gap-x-4 py-3">
            <dt class="text-gray-500">Address</dt>
            <a href="https://www.google.com/maps/place/${res.gps_coordinates.latitude},${res.gps_coordinates.longitude}" target="blank">
              <dd class="text-gray-700 underline">${res.address || 'N/A'}</dd>
            </a>
          </div>
        </dl>
      </li>
    `
    resultsTable.insertAdjacentHTML('afterbegin', html);
  });
  loaderContainer.classList.add('hide');
  pagination.classList.remove('hide');
  pagination.classList.add('flex');
  buildPagination(response);
}

function buildPagination(response) {
  const currentPageNum = response.serpapi_pagination.current;
  const links = response.serpapi_pagination.other_pages;
  links[String(currentPageNum)] = response.serpapi_pagination.next_link.slice(0, -9);
  const nextPage = response.serpapi_pagination.next_link;
  const previousPage = response.serpapi_pagination.previous_link;
  buildPaginationHtml(links, currentPageNum, nextPage, previousPage);
}

function buildPaginationHtml(links, currentPageNum, nextPage, previousPage) {
  Object.entries(links).map(([key, value]) => [value, key]).reverse().forEach((link) => {
    const numberLinks = `
      <a href="${link[0]}" class="inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium
      ${String(currentPageNum) === link[1] ? 'border-indigo-500 text-indigo-600 pointer-events-none' :
      'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} page--link" onclick="fetchPage(event)">${link[1]}</a>
    `
    paginationLinks.insertAdjacentHTML('afterbegin', numberLinks);
  });

  const previous = `
      <a href="${previousPage}"
        class="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500
        hover:border-gray-300 hover:text-gray-700 ${previousPage === undefined ? `pointer-events-none` : ''}" onclick="fetchPage(event)">
        <svg class="mr-3 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd"
            d="M18 10a.75.75 0 01-.75.75H4.66l2.1 1.95a.75.75 0 11-1.02 1.1l-3.5-3.25a.75.75 0 010-1.1l3.5-3.25a.75.75 0
              111.02 1.1l-2.1 1.95h12.59A.75.75 0 0118 10z"
            clip-rule="evenodd" />
        </svg>
        Previous
      </a>
    `
    const next = `
      <a href="${nextPage}"
        class="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-500
        hover:border-gray-300 hover:text-gray-700 ${nextPage === undefined ? `pointer-events-none` : ''}" onclick="fetchPage(event)">
        Next
        <svg class="ml-3 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd"
            d="M2 10a.75.75 0 01.75-.75h12.59l-2.1-1.95a.75.75 0 111.02-1.1l3.5 3.25a.75.75 0 010 1.1l-3.5 3.25a.75.75 0
              11-1.02-1.1l2.1-1.95H2.75A.75.75 0 012 10z"
            clip-rule="evenodd" />
        </svg>
      </a>
    `
  pagination.classList.add('flex');
  pagination.classList.remove('hide');
  previousLink.insertAdjacentHTML('afterbegin', previous);
  nextLink.insertAdjacentHTML('afterbegin', next);
}
