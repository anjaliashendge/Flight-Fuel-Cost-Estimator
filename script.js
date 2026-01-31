//API Keys
const GEO_API_KEY = "f912e6b9233a4ca69eb9fe65b2a769b0";
const CURRENCY_API_KEY = "fe9162d72d7247e2bee9c3ca";

//Aircraft Data (fuel burn per km in USD)
const aircraftData = {
  Airbus: {
    A320: { burn: 2.5 },
    A321: { burn: 2.8 },
    A350: { burn: 5.5 }
  },
  Boeing: {
    B737: { burn: 2.7 },
    B787: { burn: 5.8 },
    B777: { burn: 6.2 }
  },
  ATR: {
    ATR72: { burn: 1.6 }
  }
};

//CONVERT LOCATION → LATITUDE & LONGITUDE
async function getCoordinates(place) {
  const url =
    "https://api.opencagedata.com/geocode/v1/json?q=" +
    encodeURIComponent(place) +
    "&key=" +
    GEO_API_KEY;

  const response = await fetch(url);
  const data = await response.json();

  // If API cannot find the place
  if (!data.results || data.results.length === 0) {
    throw new Error("Location not found: " + place);
  }

  return {
    lat: data.results[0].geometry.lat,
    lng: data.results[0].geometry.lng
  };
}

//Distance using Haversine Formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

//Currency Conversion (USD → selected currency)
async function convertCurrency(amountUSD, currency) {
  if (currency === "USD") return amountUSD;

  const url =
    "https://v6.exchangerate-api.com/v6/" +
    CURRENCY_API_KEY +
    "/latest/USD";

  const response = await fetch(url);
  const data = await response.json();

  return amountUSD * data.conversion_rates[currency];
}

//Load Aircraft Models based on Manufacturer
function loadAircraft(manufacturer) {
  $("#aircraft").empty();

  Object.keys(aircraftData[manufacturer]).forEach(model => {
    $("#aircraft").append(
      `<option value="${model}">${model}</option>`
    );
  });
}

// Initial load
loadAircraft("Airbus");

// Manufacturer change
$("#manufacturer").on("change", function () {
  loadAircraft($(this).val());
});

//Drak and Light Mode Toggle
$("#themeSwitch").on("change", function () {
  $("html").attr("data-theme", this.checked ? "dark" : "light");
});

//Main Calculation Logic
$("#calculateBtn").on("click", async function () {
  try {
    const from = $("#fromLocation").val().trim();
    const to = $("#toLocation").val().trim();
    const manufacturer = $("#manufacturer").val();
    const aircraft = $("#aircraft").val();
    const currency = $("#currency").val();

    if (!from || !to) {
      alert("Please enter both locations");
      return;
    }

    $("#result").removeClass("d-none");
    $("#output").text("Calculating route...");

    //Get coordinates
    const fromCoords = await getCoordinates(from);
    const toCoords = await getCoordinates(to);

    //Distance
    const distance = calculateDistance(
      fromCoords.lat,
      fromCoords.lng,
      toCoords.lat,
      toCoords.lng
    );

    //Fuel cost
    const burnRate = aircraftData[manufacturer][aircraft].burn;
    const costUSD = distance * burnRate;

    //Currency conversion
    const finalCost = await convertCurrency(costUSD, currency);

    $("#output").html(`
      ${finalCost.toLocaleString(undefined, {
         minimumFractionDigits: 2,
         maximumFractionDigits: 2
        })} 
        ${currency} <br>
      <small class="text-muted">
        Distance: ${distance.toFixed(0)} km
      </small>
    `);

  } catch (error) {
    alert("Could not calculate route. Check spelling or API key.");
    console.error(error);
  }
});
