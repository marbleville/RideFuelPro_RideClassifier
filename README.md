# RideFuelPro_RideClassifier

Given ride data form Strava, this project aims to classify the type of ride based on the data provided into three categories: endurance ride, interval session, and race/group ride.

# To run the project

1. Clone the repository
2. Install the required packages with npm i
3. Create a .env file with the following variables:
    - STRAVA_CLIENT_ID=[your_id]
    - STRAVA_CLIENT_SECRET=[your_secret]
    - STRAVA_ACCESS_TOKEN=0
    - STRAVA_REFRESH_TOKEN=[your_refresh_token]
    - STRAVA_ACCESS_TOKEN_EXPIRES_AT=0
4. Run the project with npm run [num] [FTP] to downlaod and classify [num] of your activities
5. The output will be a JSON file called "activities.json" with the activities downloaded and classified
