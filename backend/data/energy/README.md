# Energy activity data

The backend reads the CSV files in this directory at startup and exposes the
normalized carbon inventory through `GET /api/emissions`.

Calculation:

```text
tCO2e = activity amount x emission factor (kgCO2e/unit) / 1000
```

Solar production is converted to avoided `tCO2` with the official solar/wind
combined-margin factor. It is not subtracted from the gross corporate inventory.

Data quality assumptions and source factor metadata are returned in the API
response.
