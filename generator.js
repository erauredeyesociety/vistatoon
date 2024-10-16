// Constants for scaling the size of the text input fields for editing axis values based on text content size
const rpmAxisValuesScalar = 0.95;
const oxygenAxisValuesScalar = 0.75;

let veMapData; // Store VE map data globally
let afrMapData; // Store AFR map data globally

// Function to generate the RPM values based on user input
function generateRPMValues() {
    const rpmStart = parseInt(document.getElementById('rpmStart').value);
    const rpmEnd = parseInt(document.getElementById('rpmEnd').value);
    const rpmInterval = parseInt(document.getElementById('rpmInterval').value);

    const rpmValues = [];
    for (let rpm = rpmStart; rpm <= rpmEnd; rpm += rpmInterval) {
        rpmValues.push(rpm);
    }
    return rpmValues;
}

// Function to generate the oxygen axis values based on user input
function generateOxygenValues() {
    const oxygenStart = parseFloat(document.getElementById('oxygenStart').value);
    const oxygenEnd = parseFloat(document.getElementById('oxygenEnd').value);
    const oxygenInterval = parseFloat(document.getElementById('oxygenInterval').value);

    const oxygenValues = [];
    for (let oxygen = oxygenStart; oxygen <= oxygenEnd; oxygen += oxygenInterval) {
        oxygenValues.push(oxygen);
    }
    return oxygenValues;
}

// Function to linearly interpolate between two colors
function interpolateColor(color1, color2, ratio) {
    const r = Math.floor(color1[0] + ratio * (color2[0] - color1[0]));
    const g = Math.floor(color1[1] + ratio * (color2[1] - color1[1]));
    const b = Math.floor(color1[2] + ratio * (color2[2] - color1[2]));
    return `rgb(${r}, ${g}, ${b})`;
}

// Function to set the background color based on the value
function setInputBackgroundColor(input, keyValues) {
    const value = parseFloat(input.value);
    let color;

    // Define key values and corresponding colors
    const colors = {
        purple: [128, 0, 255],
        blue: [0, 0, 255],
        green: [0, 255, 0],
        yellow: [255, 255, 0],
        orange: [255, 165, 0],
        red: [255, 0, 0]
    };

    // Interpolation between key values and colors
    if (value <= keyValues[0]) {
        const ratio = value / keyValues[0];
        color = interpolateColor(colors.purple, colors.blue, ratio); // Purple to Blue
    } else if (value > keyValues[0] && value <= keyValues[1]) {
        const ratio = (value - keyValues[0]) / (keyValues[1] - keyValues[0]);
        color = interpolateColor(colors.blue, colors.green, ratio); // Blue to Green
    } else if (value > keyValues[1] && value <= keyValues[2]) {
        const ratio = (value - keyValues[1]) / (keyValues[2] - keyValues[1]);
        color = interpolateColor(colors.green, colors.yellow, ratio); // Green to Yellow
    } else if (value > keyValues[2] && value <= keyValues[3]) {
        const ratio = (value - keyValues[2]) / (keyValues[3] - keyValues[2]);
        color = interpolateColor(colors.yellow, colors.orange, ratio); // Yellow to Orange
    } else if (value > keyValues[3] && value <= keyValues[4]) {
        const ratio = (value - keyValues[3]) / (keyValues[4] - keyValues[3]);
        color = interpolateColor(colors.orange, colors.red, ratio); // Orange to Red
    } else {
        // Full red for values greater than keyValues[4]
        color = `rgb(255, 0, 0)`; // Red
    }

    input.style.backgroundColor = color;
}

// Function to create an editable table for the VE or AFR map
function createEditableTable(containerId, rpmValues, oxygenValues, mapType, keyValues) {
    const container = document.getElementById(containerId);
    container.innerHTML = ""; // Clear previous content

    // Create the table element
    const table = document.createElement('table');
    table.classList.add('map-table');

    // Create the header row
    const headerRow = document.createElement('tr');
    const firstHeaderCell = document.createElement('th');
    firstHeaderCell.innerText = "Oxygen / RPM";
    headerRow.appendChild(firstHeaderCell);
    
    // Add RPM headers without inputs
    rpmValues.forEach(rpm => {
        const th = document.createElement('th');
        th.innerText = rpm; // Use RPM values as text
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Create rows for each oxygen value
    const mapData = [];
    oxygenValues.forEach(oxygen => {
        const row = document.createElement('tr');
        const firstCell = document.createElement('td');
        firstCell.innerText = oxygen;
        row.appendChild(firstCell);

        // Add cells for VE or AFR map values
        const rowData = [];
        rpmValues.forEach(() => {
            const inputCell = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';

            // For VE map, initialize based on RPM and oxygen
            let defaultValue;
            if (mapType === 'VE') {
                defaultValue = ((oxygen - oxygenValues[0]) / (oxygenValues[oxygenValues.length - 1] - oxygenValues[0])) *
                               ((rpmValues[rpmValues.length - 1] - rpmValues[0]) / (rpmValues[rpmValues.length - 1])) + 0.2;
            } else {
                // For AFR map
                defaultValue = 11.3 + ((oxygen - oxygenValues[0]) / (oxygenValues[oxygenValues.length - 1] - oxygenValues[0])) *
                               ((rpmValues[rpmValues.length - 1] - rpmValues[0]) / (rpmValues[rpmValues.length - 1])) * 3.8;
            }

            input.value = defaultValue.toFixed(2);
            inputCell.appendChild(input);
            row.appendChild(inputCell);
            rowData.push(input.value); // Capture initial value

            // Set background color based on value
            input.addEventListener('input', () => {
                setInputBackgroundColor(input, keyValues); // Correctly set the background color
                updateMapValue(rowData, row, rpmValues, keyValues); // Update only this row's data
            });
            // Initialize color for default value
            setInputBackgroundColor(input, keyValues); // Set initial color
        });
        table.appendChild(row);
        mapData.push(rowData); // Push row data to mapData array
    });

    // Append the table to the container
    container.appendChild(table);
    return mapData; // Return the generated map data
}

// Update the specific map value instead of regenerating the table
function updateMapValue(rowData, row, rpmValues, keyValues) {
    rowData.forEach((value, index) => {
        const inputCell = row.children[index + 1]; // Skip the first cell which is for oxygen value
        const input = inputCell.querySelector('input');
        value = parseFloat(input.value).toFixed(2);
        rowData[index] = value;
        setInputBackgroundColor(input, keyValues); // Update background color
    });

    // Update the output areas
    document.getElementById('veMapOutput').value = formatMapOutput('VE', rpmValues, generateOxygenValues(), veMapData);
    document.getElementById('afrMapOutput').value = formatMapOutput('AFR', rpmValues, generateOxygenValues(), afrMapData);
}

// Function to format map output
function formatMapOutput(mapName, rpmValues, oxygenValues, mapData) {
    return `float ${mapName}_rpm_axis[${rpmValues.length}] = {
${rpmValues.join(", ")}
};

float ${mapName}_oxygen_axis[${oxygenValues.length}] = {
${oxygenValues.join(", ")}
};

float ${mapName}[${mapData.length}][${mapData[0].length}] = {
${arrayToString(mapData)}
};
`;
}

// Helper function to convert array data to string format
function arrayToString(array) {
    return array.map(row => `{ ${row.join(", ")} }`).join(",\n");
}

// Function to generate maps
function generateMaps() {
    const rpmValues = generateRPMValues();
    const oxygenValues = generateOxygenValues();

    const veKeyValues = [0.2, 0.4, 0.6, 0.8, 1.2]; // VE Key values
    const afrKeyValues = [11.3, 12.0, 13.0, 14.0, 15.1]; // AFR Key values

    veMapData = createEditableTable('veTableContainer', rpmValues, oxygenValues, 'VE', veKeyValues);
    afrMapData = createEditableTable('afrTableContainer', rpmValues, oxygenValues, 'AFR', afrKeyValues);

    // Populate the text areas with the current axis values
    document.getElementById('rpmAxisValues').value = rpmValues.join(',');
    document.getElementById('oxygenAxisValues').value = oxygenValues.join(',');

    // Update the output areas
    document.getElementById('veMapOutput').value = formatMapOutput('VE', rpmValues, oxygenValues, veMapData);
    document.getElementById('afrMapOutput').value = formatMapOutput('AFR', rpmValues, oxygenValues, afrMapData);
}

// Function to update maps from inputs (called after editing values)
function updateMapsFromInputs() {
    const rpmAxisValues = document.getElementById('rpmAxisValues').value.split(',').map(Number);
    const oxygenAxisValues = document.getElementById('oxygenAxisValues').value.split(',').map(Number);

    const veKeyValues = [0.2, 0.4, 0.6, 0.8, 1.2]; // VE Key values
    const afrKeyValues = [11.3, 12.0, 13.0, 14.0, 15.1]; // AFR Key values

    veMapData = createEditableTable('veTableContainer', rpmAxisValues, oxygenAxisValues, 'VE', veKeyValues);
    afrMapData = createEditableTable('afrTableContainer', rpmAxisValues, oxygenAxisValues, 'AFR', afrKeyValues);

    // Populate the text areas with the current axis values
    document.getElementById('rpmAxisValues').value = rpmAxisValues.join(',');
    document.getElementById('oxygenAxisValues').value = oxygenAxisValues.join(',');

    // Update the output areas
    document.getElementById('veMapOutput').value = formatMapOutput('VE', rpmAxisValues, oxygenAxisValues, veMapData);
    document.getElementById('afrMapOutput').value = formatMapOutput('AFR', rpmAxisValues, oxygenAxisValues, afrMapData);
}

// Copy the map output to the clipboard
function copyToClipboard() {
    const veOutput = document.getElementById('veMapOutput');
    const afrOutput = document.getElementById('afrMapOutput');

    veOutput.select();
    document.execCommand("copy");

    afrOutput.select();
    document.execCommand("copy");

    alert("Map outputs copied to clipboard!");
}

// Generate maps on page load
window.onload = generateMaps;
