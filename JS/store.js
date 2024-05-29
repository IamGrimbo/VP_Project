let gamesData; // Variable to store all game data
let renderedGamesCount = 0; // Variable to track the number of rendered games
let isLoading = false; // Variable to track if data is being loaded

// Load the dataset from games.json
function loadDataset() {
    return d3.json("../Dataset/games.json");
}

// Function to render all items
function renderAllItems() {
    currentRenderingMode = "all";
    if (!gamesData) {
        loadDataset().then(data => {
            console.log("Data loaded:", data);
            gamesData = data; // Store all game data
            // Render only the first 20 items and apply sorting
            renderGrid(data.slice(0, 20), false, true, "all"); // Pass "all" as the rendering mode
            renderedGamesCount = 20; // Update the rendered games count
        }).catch(error => {
            console.error('Error loading data:', error);
        });
    } else {
        // Render only the first 20 items and apply sorting
        renderGrid(gamesData.slice(0, 20), false, true, currentRenderingMode); // Pass "all" as the rendering mode
        renderedGamesCount = 20; // Update the rendered games count
    }
}

// Function to render top-rated items
function renderTopRatedItems() {
    currentRenderingMode = "top-rated";
    if (!gamesData) {
        loadDataset().then(data => {
            console.log("Data loaded:", data);
            gamesData = data; // Store all game data
            // Sort the data by positive_ratio and user_reviews
            const sortedData = data.slice().sort((a, b) => {
                if (a.positive_ratio !== b.positive_ratio) {
                    return b.positive_ratio - a.positive_ratio;
                } else {
                    return b.user_reviews - a.user_reviews;
                }
            });
            // Render only the first 20 items
            renderGrid(sortedData.slice(0, 20), false, false, currentRenderingMode); // Pass "top-rated" as the rendering mode
            renderedGamesCount = 20; // Update the rendered games count
        }).catch(error => {
            console.error('Error loading data:', error);
        });
    } else {
        // Sort the data by positive_ratio and user_reviews
        const sortedData = gamesData.slice().sort((a, b) => {
            if (a.positive_ratio !== b.positive_ratio) {
                return b.positive_ratio - a.positive_ratio;
            } else {
                return b.user_reviews - a.user_reviews;
            }
        });
        // Render only the first 20 items
        renderGrid(sortedData.slice(0, 20), false, false, currentRenderingMode); // Pass "top-rated" as the rendering mode
        renderedGamesCount = 20; // Update the rendered games count
    }
}

// Function to render discounted items
function renderDiscountedItems() {
    currentRenderingMode = "discounted";
    if (!gamesData) {
        loadDataset().then(data => {
            console.log("Data loaded:", data);
            gamesData = data; // Store all game data
            console.log("Total games count:", gamesData.length); // Log the total number of games
            // Filter out games with discount greater than 0
            const discountedGames = data.filter(game => game.discount > 0);
            // Sort the discounted games by discount percentage
            const sortedDiscountedGames = discountedGames.sort((a, b) => b.discount - a.discount);
            // Render only the first 20 discounted items
            renderGrid(sortedDiscountedGames.slice(0, 20), false, false, currentRenderingMode); // Pass "discounted" as the rendering mode
            // Update the rendered games count
            renderedGamesCount = sortedDiscountedGames.length;
            // Update the total games count
            totalGamesCount = data.length;
        }).catch(error => {
            console.error('Error loading data:', error);
        });
    } else {
        // Filter out games with discount greater than 0
        const discountedGames = gamesData.filter(game => game.discount > 0);
        // Sort the discounted games by discount percentage
        const sortedDiscountedGames = discountedGames.sort((a, b) => b.discount - a.discount);
        // Render only the first 20 discounted items
        renderGrid(sortedDiscountedGames.slice(0, 20), false, false, currentRenderingMode); // Pass "discounted" as the rendering mode
        // Update the rendered games count
        renderedGamesCount = sortedDiscountedGames.length;
    }
}

// Render grid function
function renderGrid(games, append = true, applySorting = true, renderMode = "") {
    console.log("Rendering grid with games:", games);
    const grid = d3.select(".game-list");

    if (!append) {
        grid.html(''); // Clear the existing game list if not appending
    }

    if (applySorting) {
        // Apply sorting based on the render mode
        switch (renderMode) {
            case "all":
                // Sorting logic for "All Items"
                games.sort((a, b) => {
                    // Example sorting logic: Sort by game title alphabetically
                    return a.title.localeCompare(b.title);
                });
                break;
            case "top-rated":
                // Sorting logic for "Top Rated"
                games.sort((a, b) => {
                    // Example sorting logic: Sort by positive ratio and then by user reviews
                    if (a.positive_ratio !== b.positive_ratio) {
                        return b.positive_ratio - a.positive_ratio;
                    } else {
                        return b.user_reviews - a.user_reviews;
                    }
                });
                break;
            case "discounted":
                // Sorting logic for "Discounted"
                games = games.filter(game => game.discount > 0); // Filter out games without discount
                games.sort((a, b) => {
                    // Example sorting logic: Sort by discount percentage, positive ratio, and then by user reviews
                    if (a.discount !== b.discount) {
                        return b.discount - a.discount;
                    } else if (a.positive_ratio !== b.positive_ratio) {
                        return b.positive_ratio - a.positive_ratio;
                    } else {
                        return b.user_reviews - a.user_reviews;
                    }
                });
                break;
            default:
                break;
        }
    }

    games.forEach(game => {
        const gameDiv = grid.append("div").attr("class", "game-row");
        gameDiv.append("img").attr("src", game.image).attr("alt", game.title).attr("class", "game-image");
        const gameDetails = gameDiv.append("div").attr("class", "game-details");

        gameDetails.append("div").attr("class", "game-title").text(game.title);

        // Add tags
        const gameTags = gameDetails.append("div").attr("class", "game-tags");
        game.tags.slice(0, 5).forEach(tag => {
            gameTags.append("div").attr("class", "tag").text(tag);
        });

        // Add release date
        const releaseDate = new Date(game.date_release);
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        gameDetails.append("div").attr("class", "release-date").text(`${releaseDate.getDate()} ${monthNames[releaseDate.getMonth()]} ${releaseDate.getFullYear()}`);

        // Add rating and user reviews
        const ratingClass = game.positive_ratio >= 70 ? "rating-green" :
            game.positive_ratio >= 40 ? "rating-yellow" : "rating-red";
        const ratingDiv = gameDetails.append("div").attr("class", "rating-info");
        ratingDiv.append("div").attr("class", `rating ${ratingClass}`).text(game.rating);
        ratingDiv.append("div").attr("class", "user-reviews").text(`| ${game.user_reviews} User Reviews`);

        // Render rating tooltip
        renderRatingTooltip(ratingDiv.node(), game);

        // Add price, discount percentage, and add to cart button
        const gameInfo = gameDetails.append("div").attr("class", "game-info");

        // Discount box
        if (game.discount > 0) {
            gameInfo.append("div").attr("class", "discount-box").html(`
                <div class="discount-percent">-${game.discount}%</div>
            `);
        }

        // Price container
        const priceContainer = gameInfo.append("div").attr("class", "game-price-box");
        if (game.discount > 0) {
            priceContainer.html(`
                <div class="discounted-price">${game.price_original}€</div>
                <div class="final-price">${game.price_final}€</div>
            `);
        } else {
            priceContainer.html(`
                <div class="final-price-no-discount">${game.price_final}€</div>
            `);
        }

        gameInfo.append("button").attr("class", "add-to-cart").text("Add to Cart");
    });
}

// Function to render rating tooltip
function renderRatingTooltip(ratingDiv, game) {
    const tooltip = document.createElement('div');
    tooltip.classList.add('rating-tooltip');
    tooltip.textContent = `${game.positive_ratio}% of the ${game.user_reviews} for this game are positive`;
    ratingDiv.appendChild(tooltip);

    // Show tooltip on hover
    ratingDiv.addEventListener('mouseenter', () => {
        tooltip.style.display = 'block';
    });

    // Hide tooltip on mouse leave
    ratingDiv.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });
}

// Function to handle scrolling
function scrollHandler() {
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const documentHeight = document.body.clientHeight;

    // Calculate the remaining height before reaching the bottom
    const remainingHeight = documentHeight - (scrollY + windowHeight);

    // Define a threshold for loading new items
    const loadThreshold = 100; // Adjust as needed

    // Check if not already loading, remaining height is below the threshold, and there are remaining games to load
    if (!isLoading && remainingHeight < loadThreshold && renderedGamesCount < gamesData.length) {
        // Set isLoading to true to prevent multiple simultaneous requests
        isLoading = true;

        // Show loading indicator
        showLoadingIndicator();

        // Delay for 1 second before loading new items
        setTimeout(() => {
            // Load the next batch of items based on the current rendering mode
            let nextBatch = [];

            if (currentRenderingMode === "discounted") {
                // Filter out remaining discounted games that have not been rendered yet
                const remainingDiscountedGames = gamesData.filter(game => game.discount > 0).slice(renderedGamesCount);
                // Sort the remaining discounted games by discount percentage
                const sortedRemainingDiscountedGames = remainingDiscountedGames.sort((a, b) => b.discount - a.discount);
                // Load the next batch of discounted items
                nextBatch = sortedRemainingDiscountedGames.slice(0, 20);
            } else {
                // Load the next 20 items from the overall game data
                nextBatch = gamesData.slice(renderedGamesCount, renderedGamesCount + 20);
            }

            // Render the next set of items and append to the existing list
            renderGrid(nextBatch, true, true, currentRenderingMode); // Pass the current rendering mode

            // Update the rendered games count
            renderedGamesCount += nextBatch.length;

            // Hide loading indicator
            hideLoadingIndicator();

            // Set isLoading to false after loading is complete
            isLoading = false;
        }, 1000);
    }
}

// Function to show loading indicator
function showLoadingIndicator() {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.classList.add('loading-indicator');
    document.body.appendChild(loadingIndicator);
}

// Function to hide loading indicator
function hideLoadingIndicator() {
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
        document.body.removeChild(loadingIndicator);
    }
}

// Load all items initially
renderAllItems();
document.getElementById("all-items-btn").classList.add("selected");
// Add event listeners to sorting buttons
document.getElementById("all-items-btn").addEventListener("click", (event) => {
    event.preventDefault(); // Prevent the default link behavior
    renderAllItems();
});
document.getElementById("top-rated-btn").addEventListener("click", (event) => {
    event.preventDefault(); // Prevent the default link behavior
    renderTopRatedItems(); // Fixed function name
});
document.getElementById("discounted-btn").addEventListener("click", (event) => {
    event.preventDefault(); // Prevent the default link behavior
    renderDiscountedItems();
});

// Add scroll event listener
window.addEventListener('scroll', scrollHandler);

// Add jQuery button selection handling
$(document).ready(function(){
    $('button').on('click', function(){
        $('button').removeClass('selected');
        $(this).addClass('selected');
    });
});
