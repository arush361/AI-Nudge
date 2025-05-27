// API configurations
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/3.0/onecall';
const PRODUCT_HUNT_API_URL = 'https://api.producthunt.com/v2/api/graphql';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const QUOTE_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Get extension ID
const EXTENSION_ID = chrome.runtime.id;

// Get cached quote
function getCachedQuote() {
  const cached = localStorage.getItem('quoteData');
  if (!cached) return null;

  try {
    const { quote, timestamp } = JSON.parse(cached);
    // Check if cache is still valid (less than 30 minutes old)
    if (Date.now() - timestamp < QUOTE_CACHE_DURATION) {
      return quote;
    }
  } catch (error) {
    console.error('Error parsing cached quote:', error);
  }
  return null;
}

// Save quote to cache
function cacheQuote(quote) {
  try {
    localStorage.setItem('quoteData', JSON.stringify({
      quote,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Error caching quote:', error);
  }
}

// Get quote from ChatGPT
async function fetchQuoteFromChatGPT() {
  try {
    // Check cache first
    const cachedQuote = getCachedQuote();
    if (cachedQuote) {
      console.log('Using cached quote');
      return cachedQuote;
    }

    // Get API key from settings
    const { userSettings } = await chrome.storage.sync.get('userSettings');
    if (!userSettings?.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userSettings.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: 'Give me an inspiring quote in JSON format with text and author fields. Response should be ONLY the JSON, nothing else. Make it unique and thought-provoking. Example format: {"text": "quote here", "author": "author name"}'
        }],
        max_tokens: 150,
        temperature: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const quoteJson = JSON.parse(data.choices[0].message.content);
    
    // Cache the new quote
    cacheQuote(quoteJson);
    return quoteJson;
  } catch (error) {
    console.error('Error fetching quote from ChatGPT:', error);
    // Return one of several fallback quotes randomly
    const fallbackQuotes = [
      {
        text: "The best way to predict the future is to create it.",
        author: "Peter Drucker"
      },
      {
        text: "Innovation distinguishes between a leader and a follower.",
        author: "Steve Jobs"
      },
      {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs"
      },
      {
        text: "Everything is possible. The impossible just takes longer.",
        author: "Dan Brown"
      }
    ];
    const fallbackQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    cacheQuote(fallbackQuote); // Cache the fallback quote too
    return fallbackQuote;
  }
}

// Update quote display
async function updateQuote() {
  try {
    const quote = await fetchQuoteFromChatGPT();
    const container = document.querySelector('.date-weather');
    
    // Remove existing quote if any
    const existingQuote = document.querySelector('.daily-quote');
    if (existingQuote) {
      existingQuote.remove();
    }
    
    // Create and add new quote element
    const quoteElement = document.createElement('div');
    quoteElement.className = 'daily-quote';
    quoteElement.innerHTML = `
      <div class="quote-container">
        <span class="quote-text">${quote.text}</span>
        <span class="quote-author">&mdash; ${quote.author}</span>
      </div>
    `;
    
    container.insertAdjacentElement('afterend', quoteElement);
  } catch (error) {
    console.error('Error updating quote:', error);
  }
}

// Get cached weather data
function getCachedWeather() {
  const cached = localStorage.getItem('weatherData');
  if (!cached) return null;

  try {
    const { data, timestamp } = JSON.parse(cached);
    // Check if cache is still valid (less than 1 hour old)
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  } catch (error) {
    console.error('Error parsing cached weather:', error);
  }
  return null;
}

// Save weather data to cache
function cacheWeather(data) {
  try {
    localStorage.setItem('weatherData', JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Error caching weather:', error);
  }
}

// Update time and date
function updateDateTime() {
  const now = new Date();
  
  // Update time
  const timeElement = document.getElementById('time');
  timeElement.textContent = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  // Update date
  const dateElement = document.getElementById('date');
  dateElement.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

// Get user's location
async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => resolve(position.coords),
      error => reject(error)
    );
  });
}

// Fetch weather data
async function fetchWeather(latitude, longitude) {
  // First check cache
  const cachedData = getCachedWeather();
  if (cachedData) {
    console.log('Using cached weather data');
    return cachedData;
  }

  try {
    // Get API key from settings
    const { userSettings } = await chrome.storage.sync.get('userSettings');
    if (!userSettings?.weatherApiKey) {
      throw new Error('Weather API key not configured');
    }

    const response = await fetch(
      `${WEATHER_API_BASE}?lat=${latitude}&lon=${longitude}&exclude=hourly,daily&units=metric&appid=${userSettings.weatherApiKey}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Weather API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      if (response.status === 401) {
        const weatherContainer = document.getElementById('weather');
        weatherContainer.innerHTML = `
          <div class="weather-info">
            <div class="temperature">--°C</div>
            <div class="weather-description">Invalid API Key</div>
          </div>
        `;
      }
      
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data || !data.current || !data.current.weather) {
      throw new Error('Invalid weather data format');
    }
    
    // Cache the current weather data
    cacheWeather(data.current);
    return data.current;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

// Update weather display
function updateWeather(weatherData) {
  const weatherContainer = document.getElementById('weather');

  if (!weatherData) {
    weatherContainer.innerHTML = `
      <div class="weather-info">
        <div class="temperature">--°C</div>
        <div class="weather-description">Loading...</div>
      </div>
    `;
    return;
  }

  // Get the appropriate weather icon
  let iconName = weatherData.weather[0].icon;
  // If it's nighttime (ends with 'n'), use day icon instead for better visibility
  if (iconName.endsWith('n')) {
    iconName = iconName.replace('n', 'd');
  }

  // Capitalize each word in description
  const description = weatherData.weather[0].description
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Use String.fromCharCode(176) for the degree symbol to avoid encoding issues
  weatherContainer.innerHTML = `
    <img class="weather-icon" src="https://openweathermap.org/img/wn/${iconName}@2x.png" alt="Weather">
    <div class="weather-info">
      <div class="temperature">${Math.round(weatherData.temp)}${String.fromCharCode(176)}C</div>
      <div class="weather-description">${description}</div>
    </div>
  `;
}

// Initialize weather with auto-update
async function initWeather() {
  try {
    const coords = await getUserLocation();
    
    // Initial fetch
    const weatherData = await fetchWeather(coords.latitude, coords.longitude);
    updateWeather(weatherData);

    // Set up periodic updates
    setInterval(async () => {
      const weatherData = await fetchWeather(coords.latitude, coords.longitude);
      updateWeather(weatherData);
    }, CACHE_DURATION); // Update every hour

  } catch (error) {
    console.error('Error initializing weather:', error);
    document.getElementById('weather').style.display = 'none';
  }
}

// Handle search box
function setupSearchBox() {
  const searchBox = document.getElementById('search-box');
  searchBox.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchBox.value.trim();
      if (query) {
        // Check if it's a URL
        if (query.includes('.') && !query.includes(' ')) {
          let url = query;
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }
          window.location.href = url;
        } else {
          // Treat as search query
          window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }
      }
    }
  });
}

// Fetch Product Hunt posts
async function fetchProductHuntPosts() {
  try {
    // Get API key from settings
    const { userSettings } = await chrome.storage.sync.get('userSettings');
    if (!userSettings?.productHuntApiKey) {
      throw new Error('Product Hunt API key not configured');
    }

    const query = `
      query {
        posts(first: 4, order: RANKING) {
          edges {
            node {
              id
              name
              tagline
              thumbnail {
                url
              }
              url
              votesCount
              commentsCount
            }
          }
        }
      }
    `;

    const response = await fetch(PRODUCT_HUNT_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userSettings.productHuntApiKey}`,
        'Origin': `chrome-extension://${EXTENSION_ID}`,
        'Host': 'api.producthunt.com'
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Product Hunt API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error('Product Hunt API request failed');
    }

    const data = await response.json();
    if (!data || !data.data || !data.data.posts || !data.data.posts.edges) {
      throw new Error('Invalid response format from Product Hunt API');
    }
    
    return data.data.posts.edges.map(edge => edge.node);
  } catch (error) {
    console.error('Error fetching Product Hunt posts:', error);
    const productHuntSection = document.querySelector('.product-hunt-section');
    if (productHuntSection) {
      if (error.message === 'Product Hunt API key not configured') {
        productHuntSection.innerHTML = `
          <div class="section-header">
            <h2 class="section-title">Configure Product Hunt API Key in Settings</h2>
          </div>
        `;
      } else {
        productHuntSection.style.display = 'none';
      }
    }
    return [];
  }
}

// Update Product Hunt display
function updateProductHuntSection(products) {
  const grid = document.getElementById('productHuntGrid');
  
  if (!products || products.length === 0) {
    grid.innerHTML = '<div class="error-message">Unable to load products</div>';
    return;
  }

  grid.innerHTML = products.map(product => `
    <a href="${product.url}" target="_blank" class="product-card">
      <img class="product-thumbnail" src="${product.thumbnail.url}" alt="${product.name}">
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-tagline">${product.tagline}</div>
        <div class="product-meta">
          <div class="product-votes">
            <svg viewBox="0 0 24 24">
              <path d="M12 4L2 20h20L12 4z"/>
            </svg>
            ${product.votesCount}
          </div>
          <div class="product-comments">
            <svg viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"/>
            </svg>
            ${product.commentsCount}
          </div>
        </div>
      </div>
    </a>
  `).join('');
}

// Initialize Product Hunt
async function initProductHunt() {
  try {
    const products = await fetchProductHuntPosts();
    updateProductHuntSection(products);

    // Update products every hour
    setInterval(async () => {
      const products = await fetchProductHuntPosts();
      updateProductHuntSection(products);
    }, 60 * 60 * 1000);
  } catch (error) {
    console.error('Error initializing Product Hunt:', error);
    document.querySelector('.product-hunt-section').style.display = 'none';
  }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
  // Setup clock
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // Setup weather
  initWeather();

  // Setup quote
  updateQuote();

  // Setup Product Hunt
  initProductHunt();

  // Setup search
  setupSearchBox();
}); 