# api-grow-a-garden
Express API using NodeJS for Grow a Garden

## Installation
Requirements:
- Unix OS
- npm

Process:
1. Clone repository to your system
   - run ```git clone https://github.com/twhamr/api-grow-a-garden.git```
2. Move into the cloned repository
   - run ```cd api-grow-a-garden/```
3. Install required packages
   - run ```npm install```
4. Start the API
   - run ```npm start```

Congrats, that's it!

## Use
The Grow a Garden API runs locally on your own server / desktop.

You can access it via ```http://localhost:11560/```

The default port for this API is ```11560```, why? No reason, just the port I came up with at the time of creating this.
If you need to use a different port, use this command in place of Installation step 4:
- ```npm start -- --port=YOUR_PORT```

## Routes
There are 8 routes within the API:

#### Status Check
```/api/v1```  
This is just a simple status check to make sure the API is online and responsive.

#### All Data
```/api/v1/all```  
This will return all the data that is available within this API.

#### Seeds
```/api/v1/seeds```  
This will return the current seed stock.

#### Gear
```/api/v1/gear```  
This will return the current gear stock.

#### Eggs
```/api/v1/eggs```  
This will return the current egg stock.

#### Cosmetics
```/api/v1/cosmetics```  
This will return the current cosmetic stock.

#### Events
```/api/v1/events```  
This will return the current events taking place within the game.

#### Weather
```/api/v1/weather```  
This will return the current weather condition within the game.
