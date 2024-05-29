document.addEventListener('DOMContentLoaded', () => {
    let chartInstance = null;

    document.getElementById('generateChart').addEventListener('click', generateChart);
    document.getElementById('visualizationType').addEventListener('change', handleVisualizationTypeChange);

    async function fetchData() {
        const response = await fetch('../Dataset/games.json');
        const data = await response.json();
        return data;
    }

    function countOccurrences(arr) {
        return arr.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});
    }

    function processData(data, type) {
        let items = [];
        data.forEach(game => {
            if (type === 'genres') {
                items = items.concat(game.genres);
            } else if (type === 'tags') {
                items = items.concat(game.tags);
            } else if (type === 'categories') {
                items = items.concat(game.categories);
            } else if (type === 'os') {
                if (game.win === "True") items.push("Windows");
                if (game.mac === "True") items.push("Mac");
                if (game.linux === "True") items.push("Linux");
                if (game.steam_deck === "True") items.push("Steam Deck");
            }
        });
        let counts = countOccurrences(items);

        const threshold = type === 'genres' ? 100 : type === 'tags' ? 1500 : 140;
        let filteredCounts = {};
        let othersCount = 0;
        let othersItems = [];
        for (let key in counts) {
            if (counts[key] >= threshold) {
                filteredCounts[key] = counts[key];
            } else {
                othersCount += counts[key];
                othersItems.push(key);
            }
        }

        let sortedCounts = Object.entries(filteredCounts).sort((a, b) => b[1] - a[1]);

        if (othersCount > 0) {
            sortedCounts.push(['Others', othersCount]);
        }

        let labels = sortedCounts.map(item => item[0]);
        let values = sortedCounts.map(item => item[1]);

        return { labels, values, othersItems };
    }

    function generateColors(numColors) {
        const colors = [];
        for (let i = 0; i < numColors; i++) {
            const color = `hsl(${Math.random() * 360}, 100%, 75%)`;
            colors.push(color);
        }
        return colors;
    }

    function handleVisualizationTypeChange() {
        const visualizationType = document.getElementById('visualizationType').value;
        const chartTypeContainer = document.getElementById('chartTypeContainer');
        const yearContainer = document.getElementById('yearContainer');
        const monthContainer = document.getElementById('monthContainer');
        const userReviewsContainer = document.getElementById('userReviewsContainer');
        const priceUsersContainer = document.getElementById('priceUsersContainer');
        const usersPriceContainer = document.getElementById('usersPriceContainer');

        if (visualizationType === 'release_dates') {
            chartTypeContainer.style.display = 'none';
            yearContainer.style.display = 'block';
            monthContainer.style.display = 'block';
            userReviewsContainer.style.display = 'none';
            priceUsersContainer.style.display = 'none';
            usersPriceContainer.style.display = 'none';

        } else if (visualizationType === 'user_reviews_positive_ratio') {
            chartTypeContainer.style.display = 'none';
            yearContainer.style.display = 'none';
            monthContainer.style.display = 'none';
            userReviewsContainer.style.display = 'block';
            priceUsersContainer.style.display = 'none';
            usersPriceContainer.style.display = 'none';

        } else if (visualizationType === 'user_reviews_price') {
            chartTypeContainer.style.display = 'none';
            yearContainer.style.display = 'none';
            monthContainer.style.display = 'none';
            userReviewsContainer.style.display = 'none';
            priceUsersContainer.style.display = 'block';
            usersPriceContainer.style.display = 'block';

        } else {
            chartTypeContainer.style.display = 'block';
            yearContainer.style.display = 'none';
            monthContainer.style.display = 'none';
            userReviewsContainer.style.display = 'none';
            priceUsersContainer.style.display = 'none';
            usersPriceContainer.style.display = 'none';
        }
    }

    function generateChart() {
        const visualizationType = document.getElementById('visualizationType').value;
        const chartType = document.getElementById('chartType').value;
        const year = document.getElementById('year').value;
        const month = document.getElementById('month').value;
        const userReviewsThreshold = parseInt(document.getElementById('reviewThreshold').value);
        const priceUsersThreshold = parseInt(document.getElementById('priceUsersThreshold').value);
        const usersPriceThreshold = parseInt(document.getElementById('usersPriceThreshold').value);

        if (visualizationType === 'release_dates' && !year && !month) {
            alert('Please select at least one of year or month.');
            return;
        }

        fetchData().then(data => {
            if (chartInstance) {
                chartInstance.destroy();
            }

            if (visualizationType === 'release_dates') {
                generateReleaseDateChart(data, year, month);
            } else if (visualizationType === 'user_reviews_positive_ratio') {
                generateUserReviewsPositiveRatioChart(data, userReviewsThreshold);
            } else if (visualizationType === 'user_reviews_price') {
                generatePriceChart(data, priceUsersThreshold, usersPriceThreshold);
            } else {
                const { labels, values, othersItems } = processData(data, visualizationType);

                const ctx = document.getElementById('chartCanvas').getContext('2d');
                const chartData = {
                    labels: labels,
                    datasets: [{
                        label: visualizationType,
                        data: values,
                        backgroundColor: generateColors(labels.length),
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                };

                const options = {
                    responsive: true,
                    color: 'red',
                    maintainAspectRatio: false,
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            displayGameDetails(labels[index], data, visualizationType, othersItems);
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                color: 'red',
                                callback: function (value) { return value; }
                            },
                            title: {
                                display: true,
                                color: 'red',
                                text: 'Count'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                color: 'red',
                                text: visualizationType.charAt(0).toUpperCase() + visualizationType.slice(1)
                            },
                            ticks: {
                                color: 'red',
                            }
                        }
                    }
                };

                if (chartType === 'pie') {
                    delete options.scales;
                }

                chartInstance = new Chart(ctx, {
                    type: chartType,
                    data: chartData,
                    options: options
                });
            }
        });
    }

    function generateReleaseDateChart(data, year, month) {
        const releaseDates = data.map(game => ({
            date: new Date(game.date_release),
            title: game.title
        }));
        let filteredDates = releaseDates.filter(item => {
            const dateYear = item.date.getFullYear();
            const dateMonth = item.date.getMonth() + 1;
            if (year && month) {
                return dateYear == year && dateMonth == month;
            } else if (year) {
                return dateYear == year;
            } else if (month) {
                return dateMonth == month;
            } else {
                return true;
            }
        });

        let occurrences = {};
        if (year && month) {
            occurrences = filteredDates.reduce((acc, item) => {
                const day = item.date.getDate();
                acc[day] = (acc[day] || 0) + 1;
                return acc;
            }, {});

            const daysInMonth = new Date(year, month, 0).getDate();
            const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
            const values = labels.map(day => occurrences[day] || 0);

            const ctx = document.getElementById('chartCanvas').getContext('2d');
            const chartData = {
                labels: labels,
                datasets: [{
                    label: `Games released in ${getMonthName(month)} of ${year}`,
                    data: values,
                    borderColor: 'rgba(255, 0, 0, 1)',
                    backgroundColor: 'rgba(255, 0, 0, 0.2)',
                    borderWidth: 1,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: 'rgba(255, 99, 0, 1)',
                    pointBorderColor: 'rgba(255, 99, 0, 1)',
                    fill: false,
                    tension: 0.1
                }]
            };

            const options = {
                responsive: true,
                maintainAspectRatio: false,
                color: 'red',
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: 'red',
                            callback: function (value) { return value; }
                        },
                        title: {
                            display: true,
                            color: 'red',
                            text: 'Count'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            color: 'red',
                            text: 'Day of the Month'
                        },
                        ticks: {
                            color: 'red',
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        displayGameDetailsByDate(filteredDates, year, month, index + 1);
                    }
                }
            };

            chartInstance = new Chart(ctx, {
                type: 'line',
                data: chartData,
                options: options
            });
        } else if (year) {
            occurrences = filteredDates.reduce((acc, item) => {
                const month = item.date.getMonth() + 1;
                acc[month] = (acc[month] || 0) + 1;
                return acc;
            }, {});

            const labels = Array.from({ length: 12 }, (_, i) => getMonthName(i + 1));
            const values = labels.map((_, i) => occurrences[i + 1] || 0);

            const ctx = document.getElementById('chartCanvas').getContext('2d');
            const chartData = {
                labels: labels,
                datasets: [{
                    label: `Games released in ${year}`,
                    data: values,
                    borderColor: 'rgba(255, 0, 0, 1)',
                    backgroundColor: 'rgba(255, 0, 0, 0.2)',
                    borderWidth: 1,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: 'rgba(255, 99, 0, 1)',
                    pointBorderColor: 'rgba(255, 99, 0, 1)',
                    fill: false,
                    tension: 0.1
                }]
            };

            const options = {
                responsive: true,
                maintainAspectRatio: false,
                color: 'red',
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: 'red',
                            callback: function (value) { return value; }
                        },
                        title: {
                            display: true,
                            color: 'red',
                            text: 'Count'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            color: 'red',
                            text: 'Month'
                        },
                        ticks: {
                            color: 'red',
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        displayGameDetailsByDate(filteredDates, year, index + 1);
                    }
                }
            };

            chartInstance = new Chart(ctx, {
                type: 'line',
                data: chartData,
                options: options
            });
        } else if (month) {
            occurrences = filteredDates.reduce((acc, item) => {
                const year = item.date.getFullYear();
                acc[year] = (acc[year] || 0) + 1;
                return acc;
            }, {});

            const uniqueYears = [...new Set(releaseDates.map(item => item.date.getFullYear()))];
            const labels = uniqueYears.sort((a, b) => a - b);
            const values = labels.map(year => occurrences[year] || 0);

            const ctx = document.getElementById('chartCanvas').getContext('2d');
            const chartData = {
                labels: labels,
                datasets: [{
                    label: `Games released in ${getMonthName(month)} over the years`,
                    data: values,
                    borderColor: 'rgba(255, 0, 0, 1)',
                    backgroundColor: 'rgba(255, 0, 0, 0.2)',
                    borderWidth: 1,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: 'rgba(255, 99, 0, 1)',
                    pointBorderColor: 'rgba(255, 99, 0, 1)',
                    fill: false,
                    tension: 0.1
                }]
            };

            const options = {
                responsive: true,
                maintainAspectRatio: false,
                color: 'red',
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: 'red',
                            callback: function (value) { return value; }
                        },
                        title: {
                            display: true,
                            color: 'red',
                            text: 'Count'
                        },
                    },
                    x: {
                        title: {
                            display: true,
                            color: 'red',
                            text: 'Year'
                        },
                        ticks: {
                            color: 'red',
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        displayGameDetailsByDate(filteredDates, labels[index], month);
                    }
                }
            };

            chartInstance = new Chart(ctx, {
                type: 'line',
                data: chartData,
                options: options
            });
        }
    }

    function generateUserReviewsPositiveRatioChart(data, userReviewsThreshold = 1000000) {
        let filteredData;
        filteredData = data.filter(game => game.user_reviews <= userReviewsThreshold);
        const increment = userReviewsThreshold * 0.02;
        const xAxisPoints = [];
        for (let i = 0; i <= userReviewsThreshold; i += increment) {
            xAxisPoints.push(i);
        }
    
        const userReviews = [];
        const positiveRatios = [];
        const gamesAtPoints = {};
    
        xAxisPoints.forEach(point => {
            let lowerBound, upperBound;
            lowerBound = point - (increment * 0.01);
            upperBound = point + (increment * 0.01);
    
            const gamesInRange = filteredData.filter(game => game.user_reviews >= lowerBound && game.user_reviews <= upperBound);
            if (gamesInRange.length > 0) {
                const averagePositiveRatio = gamesInRange.reduce((sum, game) => sum + game.positive_ratio, 0) / gamesInRange.length;
                userReviews.push(point);
                positiveRatios.push(averagePositiveRatio);
                gamesAtPoints[point] = gamesInRange.slice(0, 3);
            }
        });
    
        const ctx = document.getElementById('chartCanvas').getContext('2d');
        const chartData = {
            labels: userReviews,
            datasets: [{
                label: 'Positive Ratio',
                data: positiveRatios,
                borderColor: 'rgba(255, 0, 0, 1)',
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                borderWidth: 1,
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: 'rgba(255, 99, 0, 1)',
                pointBorderColor: 'rgba(255, 99, 0, 1)',
                fill: false,
                tension: 0.1
            }]
        };
    
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            color: 'red',
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        color: 'red',
                        text: 'Positive Ratio (%)'
                    },
                    ticks: {
                        color: 'red',
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'User Reviews',
                        color: 'red',
                    },
                    ticks: {
                        color: 'red',
                        maxTicks: 50
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const clickedPoint = userReviews[index];
                    const games = gamesAtPoints[clickedPoint] || [];
                    displayGameDetailsByUsers(games);
                }
            }
        };
    
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: options
        });
    }
    
    function generatePriceChart(data, priceUsersThreshold = 100, usersPriceThreshold = 1000000) {
        const filteredData = data.filter(game => game.price_original <= priceUsersThreshold);
    
        const increment = usersPriceThreshold / 50;
        const xAxisPoints = [];
        for (let i = 0; i <= usersPriceThreshold; i += increment) {
            xAxisPoints.push(i);
        }
    
        const prices = [];
        const filteredXAxisPoints = [];
        const gamesAtPoints = {};
        xAxisPoints.forEach(point => {
            const lowerBound = point - (increment * 0.5);
            const upperBound = point + (increment * 0.5);
    
            const gamesInRange = filteredData.filter(game => game.user_reviews >= lowerBound && game.user_reviews <= upperBound);
            if (gamesInRange.length > 0) {
                const averagePrice = gamesInRange.reduce((sum, game) => sum + game.price_original, 0) / gamesInRange.length;
                prices.push(averagePrice);
                filteredXAxisPoints.push(point);
                gamesAtPoints[point] = gamesInRange.slice(0, 3);
            }
        });
    
        const ctx = document.getElementById('chartCanvas').getContext('2d');
        const chartData = {
            labels: filteredXAxisPoints,
            datasets: [{
                label: 'Average Price',
                data: prices,
                borderColor: 'rgba(255, 0, 0, 1)',
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                borderWidth: 1,
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: 'rgba(255, 99, 0, 1)',
                pointBorderColor: 'rgba(255, 99, 0, 1)',
                fill: false,
                tension: 0.1
            }]
        };
    
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    color: 'red',
                    beginAtZero: true,
                    title: {
                        color: 'red',
                        display: true,
                        text: 'Average Price'
                    },
                    ticks: {
                        color: 'red',
                        maxTicks: priceUsersThreshold
                    }
                },
                x: {
                    color: 'red',
                    title: {
                        color: 'red',
                        display: true,
                        text: 'User Reviews'
                    },
                    ticks: {
                        color: 'red',
                        maxTicks: 50
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const clickedPoint = filteredXAxisPoints[index];
                    const games = gamesAtPoints[clickedPoint] || [];
                    displayGameDetailsByUsers(games);
                }
            }
        };
    
        if (chartInstance) {
            chartInstance.destroy();
        }
    
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: options
        });
    }
    
    function displayGameDetailsByUsers(games) {
        if (games.length > 0) {
            const gameTitles = games.map(game => game.title).join(', ');
            showPopup(`Top games at clicked user review point: ${gameTitles}`);
        } else {
            showPopup('No games available at clicked user review point.');
        }
    }
    
    function showPopup(message) {
        const popup = document.getElementById('customPopup');
        const popupMessage = document.getElementById('popupMessage');
        popupMessage.textContent = message;
        popup.style.display = 'block';
    
        function closePopup(event) {
            if (!popup.contains(event.target)) {
                popup.style.display = 'none';
                document.removeEventListener('click', closePopup);
            }
        }
    
        document.addEventListener('click', closePopup);
    
        popup.addEventListener('blur', () => {
            popup.style.display = 'none';
        });
    
        popup.focus();
    }    
    
    function displayGameDetailsByUsers(games) {
        if (games.length > 0) {
            const gameTitles = games.map(game => game.title).join(', ');
            showPopup(`Top games at clicked user review point: ${gameTitles}`);
        } else {
            showPopup('No games available at clicked user review point.');
        }
    }
    
    function showPopup(message) {
        const popup = document.getElementById('customPopup');
        const popupMessage = document.getElementById('popupMessage');
        popupMessage.textContent = message;
        popup.style.display = 'block';
    
        function closePopup(event) {
            if (!popup.contains(event.target)) {
                popup.style.display = 'none';
                document.removeEventListener('click', closePopup);
            }
        }
    
        document.addEventListener('click', closePopup);
    
        popup.addEventListener('blur', () => {
            popup.style.display = 'none';
        });
    
        popup.focus();
    }    
    
    function displayGameDetails(label, data, visualizationType, othersItems) {
        let games = [];
        data.forEach(game => {
            if (visualizationType === 'genres' && game.genres.includes(label)) {
                games.push(game.title);
            } else if (visualizationType === 'tags' && game.tags.includes(label)) {
                games.push(game.title);
            } else if (visualizationType === 'categories' && game.categories.includes(label)) {
                games.push(game.title);
            } else if (visualizationType === 'os') {
                if (label === 'Windows' && game.win === "True") games.push(game.title);
                if (label === 'Mac' && game.mac === "True") games.push(game.title);
                if (label === 'Linux' && game.linux === "True") games.push(game.title);
                if (label === 'Steam Deck' && game.steam_deck === "True") games.push(game.title);
            } 
        });

        if (label === 'Others') {
            let otherGames = [];
            othersItems.forEach(otherItem => {
                data.forEach(game => {
                    if (game.genres.includes(otherItem) || game.tags.includes(otherItem) || game.categories.includes(otherItem)) {
                        otherGames.push(game.title);
                    }
                });
            });

            let combinedGames = games.concat(otherGames);
            let topGames = combinedGames.slice(0, 3).join(', ');
            showPopup(`Top games in Others (${othersItems.join(', ')}): ${topGames}`);
        } else {
            let topGames = games.slice(0, 3).join(', ');
            showPopup(`Top games in ${label}: ${topGames}`);
        }
    }

    function displayGameDetailsByDate(filteredDates, year, month, day = null) {
        let selectedGames = filteredDates.filter(item => {
            const dateYear = item.date.getFullYear();
            const dateMonth = item.date.getMonth() + 1;
            const dateDay = item.date.getDate();
            if (day) {
                return dateYear == year && dateMonth == month && dateDay == day;
            } else {
                return dateYear == year && dateMonth == month;
            }
        });

        if (selectedGames.length > 0) {
            const gameTitles = selectedGames.slice(0, 3).map(game => game.title).join(', ');
            const dateString = day ? `${day}-${month}-${year}` : `${getMonthName(month)}-${year}`;
            showPopup(`Top games released on ${dateString}: ${gameTitles}`);
        } else {
            alert('No games released on selected date.');
        }
    }

    function getMonthName(monthNumber) {
        const date = new Date();
        date.setMonth(monthNumber - 1);
        return date.toLocaleString('default', { month: 'long' });
    }

    function displayGameDetailsByUsers(games) {
        if (games.length > 0) {
            const gameTitles = games.map(game => game.title).join(', ');
            showPopup(`Top games at clicked point: ${gameTitles}`);
        } else {
            showPopup('No games available at clicked point.');
        }
    }

    function showPopup(message) {
        const popup = document.getElementById('customPopup');
        const popupMessage = document.getElementById('popupMessage');
        popupMessage.textContent = message;
        popup.style.display = 'block';
    
        function closePopup(event) {
            if (!popup.contains(event.target)) {
                popup.style.display = 'none';
                document.removeEventListener('click', closePopup);
            }
        }
    
        document.addEventListener('click', closePopup);
    
        popup.addEventListener('blur', () => {
            popup.style.display = 'none';
        });
    
        popup.focus();
    }
});
