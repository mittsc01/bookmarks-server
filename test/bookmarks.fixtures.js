function makeBookmarksArray() {
    return [
        {
            id: 1,
            title: "test",
            url: "https://www.runningahead.com/maps",
            description: 'map routes',
            rating: 5,
            

        },
        {   id: 2,
            title: "google",
            url: "https://google.com",
            description: 'search engine',
            rating: 2,
            
        },
        {   id:3,
            title: "weather",
            url: "https://weather.gov",
            description: '',
            rating: 2,
            
        },
        {   id:4,
            title: "onthegomap",
            url: "https://onthegomap.com/#/create",
            description: 'make map',
            rating: 2,
            
        }
    ]
  }
  
  module.exports = {
    makeBookmarksArray,
  }