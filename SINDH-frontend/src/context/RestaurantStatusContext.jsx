import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const RestaurantStatusContext = createContext();

// Custom hook to use the context
export const useRestaurantStatus = () => useContext(RestaurantStatusContext);

// Provider component
export const RestaurantStatusProvider = ({ children }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        
        // Simulate API call with timeout
        setTimeout(() => {
          // Mock data
          const mockRestaurants = [
            {
              id: 1,
              name: "Enigma Cafe",
              status: "open",
              waitTime: "5-10 min",
              rating: 4.8,
              image: "/images/restaurant1.jpg"
            },
            {
              id: 2,
              name: "Quantum Kitchen",
              status: "open",
              waitTime: "10-15 min",
              rating: 4.6,
              image: "/images/restaurant2.jpg"
            },
            {
              id: 3,
              name: "Neural Bites",
              status: "closed",
              waitTime: "Closed",
              rating: 4.5,
              image: "/images/restaurant3.jpg"
            },
            {
              id: 4,
              name: "Cyber Sushi",
              status: "open",
              waitTime: "15-20 min",
              rating: 4.7,
              image: "/images/restaurant4.jpg"
            }
          ];
          
          setRestaurants(mockRestaurants);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError("Failed to fetch restaurant data");
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  // Update restaurant status
  const updateRestaurantStatus = (id, status) => {
    setRestaurants(prevRestaurants => 
      prevRestaurants.map(restaurant => 
        restaurant.id === id 
          ? { ...restaurant, status } 
          : restaurant
      )
    );
  };

  // Get restaurant by ID
  const getRestaurantById = (id) => {
    return restaurants.find(restaurant => restaurant.id === id);
  };

  // Value object to be provided to consumers
  const value = {
    restaurants,
    loading,
    error,
    updateRestaurantStatus,
    getRestaurantById
  };

  return (
    <RestaurantStatusContext.Provider value={value}>
      {children}
    </RestaurantStatusContext.Provider>
  );
};

export default RestaurantStatusContext;
