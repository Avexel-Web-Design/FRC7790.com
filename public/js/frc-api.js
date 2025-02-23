// FRC API Configuration
const FRC_TEAM_KEY = 'frc7790';
const TBA_AUTH_KEY = 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf'; // You'll need to get this from The Blue Alliance

// API Endpoints
const TBA_BASE_URL = 'https://www.thebluealliance.com/api/v3';

// Fetch current event data - modified for testing
async function getCurrentEventData() {
    try {
        const response = await fetch(`${TBA_BASE_URL}/event/2024mitvc`, {
            headers: {
                'X-TBA-Auth-Key': TBA_AUTH_KEY
            }
        });
        const event = await response.json();
        return event;
    } catch (error) {
        console.error('Error fetching event data:', error);
        return null;
    }
}

// New function to calculate the next event automatically
async function getNextEvent() {
    try {
        const response = await fetch(`${TBA_BASE_URL}/team/${FRC_TEAM_KEY}/events/simple`, {
            headers: { 'X-TBA-Auth-Key': TBA_AUTH_KEY }
        });
        const events = await response.json();
        const now = new Date();
        // Filter for upcoming or currently ongoing events
        const upcoming = events.filter(event => {
            const start = new Date(event.start_date);
            const end = new Date(event.end_date);
            return start >= now || (start < now && end > now);
        });
        upcoming.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        return upcoming[0];
    } catch (error) {
        console.error('Error fetching next event:', error);
        return null;
    }
}

// Update UI elements with loading state
function setLoadingState(isLoading) {
    const loadingElements = {
        ranking: {
            number: document.getElementById('ranking-number'),
            total: document.getElementById('total-teams')
        },
        record: {
            wins: document.getElementById('wins'),
            losses: document.getElementById('losses')
        },
        nextMatch: {
            number: document.getElementById('match-number'),
            time: document.getElementById('match-time'),
            blue: document.getElementById('blue-alliance'),
            red: document.getElementById('red-alliance')
        }
    };

    if (isLoading) {
        loadingElements.ranking.number.textContent = '...';
        loadingElements.ranking.total.textContent = 'Fetching data...';
        loadingElements.record.wins.textContent = '...';
        loadingElements.record.losses.textContent = '...';
        loadingElements.nextMatch.number.textContent = 'Loading...';
        loadingElements.nextMatch.time.textContent = 'Fetching schedule...';
        loadingElements.nextMatch.blue.textContent = 'Loading alliance...';
        loadingElements.nextMatch.red.textContent = 'Loading alliance...';
    }
}

// Handle errors gracefully
function setErrorState(element, message = 'No data available') {
    const el = document.getElementById(element);
    if (el) {
        el.textContent = message;
    }
}

// Update rankings display with better error handling
async function updateRankings(eventKey) {
    try {
        const response = await fetch(`${TBA_BASE_URL}/event/${eventKey}/rankings`, {
            headers: {
                'X-TBA-Auth-Key': TBA_AUTH_KEY
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch rankings');
        
        const rankings = await response.json();
        const teamRanking = rankings.rankings.find(r => r.team_key === FRC_TEAM_KEY);
        
        if (teamRanking) {
            const rankingEl = document.getElementById('ranking-number');
            rankingEl.textContent = teamRanking.rank;
            rankingEl.setAttribute('data-target', teamRanking.rank);
            // Re-trigger counter animation
            runCounter(rankingEl);
            document.getElementById('total-teams').textContent = `of ${rankings.rankings.length} teams`;
        } else {
            setErrorState('ranking-number', '--');
            setErrorState('total-teams', 'Not currently ranked');
        }
    } catch (error) {
        console.error('Error fetching rankings:', error);
        setErrorState('ranking-number', '--');
        setErrorState('total-teams', 'Rankings unavailable');
    }
}

// Update match record
async function updateRecord(eventKey) {
    try {
        const response = await fetch(`${TBA_BASE_URL}/team/${FRC_TEAM_KEY}/event/${eventKey}/matches`, {
            headers: {
                'X-TBA-Auth-Key': TBA_AUTH_KEY
            }
        });
        const matches = await response.json();
        
        let wins = 0;
        let losses = 0;
        
        matches.forEach(match => {
            if (match.winning_alliance) {
                const isBlue = match.alliances.blue.team_keys.includes(FRC_TEAM_KEY);
                const isWinner = (isBlue && match.winning_alliance === 'blue') ||
                               (!isBlue && match.winning_alliance === 'red');
                if (isWinner) wins++;
                else losses++;
            }
        });
        
        const winsEl = document.getElementById('wins');
        const lossesEl = document.getElementById('losses');
        winsEl.setAttribute('data-target', wins);
        lossesEl.setAttribute('data-target', losses);
        // Re-trigger counter animation
        runCounter(winsEl);
        runCounter(lossesEl);
    } catch (error) {
        console.error('Error fetching match record:', error);
    }
}

// Update next match with better error handling
async function updateNextMatch(eventKey) {
    try {
        const response = await fetch(`${TBA_BASE_URL}/team/${FRC_TEAM_KEY}/event/${eventKey}/matches`, {
            headers: {
                'X-TBA-Auth-Key': TBA_AUTH_KEY
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch matches');
        
        const matches = await response.json();
        const nextMatch = matches.find(match => !match.actual_time && match.predicted_time);
        
        if (nextMatch) {
            document.getElementById('match-number').textContent = `Match ${nextMatch.match_number}`;
            
            const matchTime = new Date(nextMatch.predicted_time * 1000);
            document.getElementById('match-time').textContent = matchTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            
            const blueAlliance = nextMatch.alliances.blue.team_keys
                .map(team => team.replace('frc', ''))
                .join(', ');
            const redAlliance = nextMatch.alliances.red.team_keys
                .map(team => team.replace('frc', ''))
                .join(', ');
            
            document.getElementById('blue-alliance').textContent = blueAlliance;
            document.getElementById('red-alliance').textContent = redAlliance;
        } else {
            document.getElementById('match-number').textContent = 'No upcoming matches';
            document.getElementById('match-time').textContent = '--:--';
            document.getElementById('blue-alliance').textContent = 'TBD';
            document.getElementById('red-alliance').textContent = 'TBD';
        }
    } catch (error) {
        console.error('Error fetching next match:', error);
        setErrorState('match-number', 'Match data unavailable');
        setErrorState('match-time', '--:--');
        setErrorState('blue-alliance', 'TBD');
        setErrorState('red-alliance', 'TBD');
    }
}

// Add countdown functionality
function updateCountdown(startDate) {
    const now = new Date().getTime();
    const eventStart = new Date(startDate).getTime();
    const timeLeft = eventStart - now;

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    // Update UI with countdown
    document.getElementById('ranking-number').textContent = days;
    document.getElementById('total-teams').textContent = 'Days until event';
    
    document.getElementById('wins').textContent = hours;
    document.getElementById('losses').textContent = minutes;
    
    // Update labels
    document.querySelector('[for="wins"]').textContent = 'Hours';
    document.querySelector('[for="losses"]').textContent = 'Minutes';
    
    // Update next match section
    document.getElementById('match-number').textContent = 'Event Starting Soon';
    document.getElementById('match-time').textContent = new Date(startDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('blue-alliance').textContent = 'At';
    document.getElementById('red-alliance').textContent = new Date(startDate).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// New function for event countdown
function updateEventCountdown(startDate) {
    const now = new Date().getTime();
    const eventStart = new Date(startDate).getTime();
    let timeLeft = eventStart - now;
    if(timeLeft < 0) timeLeft = 0;
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    document.getElementById('countdown-timer').textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Initialize and update all data with loading states
async function initializeEventData() {
    setLoadingState(true);
    const OFFSET_MS = 37 * 3600 * 1000; // 37 hour offset
    
    try {
        // Use calculated next event instead of a hardcoded one
        const currentEvent = await getNextEvent();
        if (currentEvent) {
            const now = new Date();
            const adjustedEventStart = new Date(new Date(currentEvent.start_date).getTime() + OFFSET_MS);
            const adjustedEventEnd = new Date(new Date(currentEvent.end_date).getTime() + OFFSET_MS);

            if (now < adjustedEventStart || now > adjustedEventEnd) {
                document.getElementById('live-updates').classList.add('hidden');
                document.getElementById('countdown-section').classList.remove('hidden');

                const targetDate = now < adjustedEventStart ? adjustedEventStart : adjustedEventEnd;
                updateEventCountdown(targetDate);
                setInterval(() => {
                    updateEventCountdown(targetDate);
                }, 1000);
            } else {
                document.getElementById('live-updates').classList.remove('hidden');
                document.getElementById('countdown-section').classList.add('hidden');

                await Promise.all([
                    updateRankings(currentEvent.key),
                    updateRecord(currentEvent.key),
                    updateNextMatch(currentEvent.key)
                ]);
                
                setInterval(() => {
                    updateRankings(currentEvent.key);
                    updateRecord(currentEvent.key);
                    updateNextMatch(currentEvent.key);
                }, 300000);
            }
        } else {
            setErrorState('ranking-number', 'No upcoming event');
            setErrorState('total-teams', 'Check back later');
        }
    } catch (error) {
        console.error('Error initializing data:', error);
        setErrorState('ranking-number', 'Error loading data');
    }
}

// Start updates when document is loaded
document.addEventListener('DOMContentLoaded', initializeEventData);
