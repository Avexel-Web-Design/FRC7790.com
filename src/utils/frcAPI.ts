/**
 * FRC API Service - TypeScript implementation of The Blue Alliance API
 * 
 * This service provides type-safe access to FRC competition data,
 * including team rankings, match results, and event information.
 */

// API Configuration
export const TBA_AUTH_KEY = "gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf";
const TBA_BASE_URL = "https://www.thebluealliance.com/api/v3";
const FRC_TEAM_KEY = "frc7790";

// Time offsets for different event types (in milliseconds)
const OFFSET_MS = 37 * 3600 * 1000; // 37 hour offset for district events
const MICMP_OFFSET_MS = 20.5 * 3600 * 1000; // Michigan championship
const TXCMP_OFFSET_MS = 17.5 * 3600 * 1000; // Texas championship
const NECMP_OFFSET_MS = (17 + (1/6)) * 3600 * 1000; // New England championship

// Type definitions
export interface TeamRanking {
  rank: number;
  team_key: string;
  wins: number;
  losses: number;
  ties: number;
}

export interface Match {
  key: string;
  comp_level: string;
  match_number: number;
  predicted_time: number;
  actual_time?: number;
  alliances: {
    blue: { team_keys: string[] };
    red: { team_keys: string[] };
  };
}

export interface Event {
  key: string;
  name: string;
  start_date: string;
  end_date: string;
  event_type: number;
}

export interface CompetitionData {
  ranking: number;
  totalTeams: number;
  wins: number;
  losses: number;
  ties: number;
  nextMatch: Match | null;
  eventName: string;
}

// Helper functions
export function getOffsetForEvent(eventKey: string): number {
  if (!eventKey) return OFFSET_MS;
  
  const eventLower = eventKey.toLowerCase();
  
  if (eventLower.includes('micmp')) return MICMP_OFFSET_MS;
  if (eventLower.includes('txcmp')) return TXCMP_OFFSET_MS;
  if (eventLower.includes('necmp')) return NECMP_OFFSET_MS;
  
  return OFFSET_MS;
}

export function formatRankSuffix(rank: number): string {
  // Handle special cases for 11, 12, 13
  if (rank % 100 >= 11 && rank % 100 <= 13) {
    return "th";
  }
  
  // Handle standard cases based on last digit
  switch (rank % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

export function formatEventDate(startDate: string, endDate?: string): string {
  if (!startDate) return "Date TBD";
  
  try {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const start = new Date(startDate).toLocaleDateString('en-US', options);
    
    if (!endDate) return start;
    
    const end = new Date(endDate).toLocaleDateString('en-US', options);
    return `${start} - ${end}`;
  } catch (e) {
    return startDate;
  }
}

// Fetch OPR / DPR / CCWM for an event
export async function fetchEventOPRs(eventKey: string): Promise<{
  oprs: Record<string, number>;
  dprs: Record<string, number>;
  ccwms: Record<string, number>;
}> {
  try {
    const res = await fetch(`${TBA_BASE_URL}/event/${eventKey}/oprs`, {
      headers: { 'X-TBA-Auth-Key': TBA_AUTH_KEY },
    });
    if (!res.ok) throw new Error(`TBA error ${res.status}`);
    return res.json();
  } catch (e) {
    console.error('Error fetching OPRs', e);
    return { oprs: {}, dprs: {}, ccwms: {} };
  }
}

// API Service Class
export class FRCAPIService {
  private static instance: FRCAPIService;
  
  public static getInstance(): FRCAPIService {
    if (!FRCAPIService.instance) {
      FRCAPIService.instance = new FRCAPIService();
    }
    return FRCAPIService.instance;
  }

  private async fetchAPI(endpoint: string): Promise<any> {
    try {
      const response = await fetch(`${TBA_BASE_URL}${endpoint}`, {
        headers: {
          "X-TBA-Auth-Key": TBA_AUTH_KEY,
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  // Generic request method for our own backend API with retry logic
  async request(method: string, path: string, data?: any, retryCount = 0): Promise<Response> {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    console.log(`API Request: ${method} ${path} (attempt ${retryCount + 1})`);
    console.log('Token:', token ? `${token.substring(0, 15)}...` : 'No token');

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data) {
      config.body = JSON.stringify(data);
      console.log('Request data:', data);
    }

    console.log('Request headers:', headers);
    
    try {
      const response = await fetch(`/api${path}`, config);
      console.log(`Response status: ${response.status}`);
      
      // Handle rate limiting with exponential backoff
      if (response.status === 429 && retryCount < 3) {
        const retryAfter = response.headers.get('Retry-After');
        const backoffDelay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, retryCount) * 1000;
        
        console.log(`Rate limited, retrying after ${backoffDelay}ms (attempt ${retryCount + 1}/3)`);
        
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return this.request(method, path, data, retryCount + 1);
      }
      
      return response;
    } catch (error) {
      console.error(`API request error for ${method} ${path}:`, error);
      throw error;
    }
  }

  async get(path: string): Promise<Response> {
    return this.request('GET', path);
  }

  async post(path: string, data: any): Promise<Response> {
    return this.request('POST', path, data);
  }

  async put(path: string, data: any): Promise<Response> {
    return this.request('PUT', path, data);
  }

  async delete(path: string): Promise<Response> {
    return this.request('DELETE', path);
  }

  async getTeamEvents(year: number = new Date().getFullYear()): Promise<Event[]> {
    return this.fetchAPI(`/team/${FRC_TEAM_KEY}/events/${year}/simple`);
  }

  async getCurrentEvent(): Promise<Event | null> {
    try {
      const events = await this.getTeamEvents();
      const now = new Date();
      
      // Find current or next upcoming event
      const currentOrUpcoming = events.filter((event) => {
        const eventEnd = new Date(event.end_date);
        eventEnd.setDate(eventEnd.getDate() + 1); // Include the end day
        return eventEnd >= now;
      });
      
      currentOrUpcoming.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
      return currentOrUpcoming[0] || null;
    } catch (error) {
      console.error("Error getting current event:", error);
      return null;
    }
  }

  async getEventRankings(eventKey: string): Promise<TeamRanking[]> {
    try {
      const response = await this.fetchAPI(`/event/${eventKey}/rankings`);
      return response.rankings || [];
    } catch (error) {
      console.error("Error fetching rankings:", error);
      return [];
    }
  }

  async getTeamRanking(eventKey: string): Promise<{ rank: number; totalTeams: number; wins: number; losses: number; ties: number } | null> {
    try {
      const rankings = await this.getEventRankings(eventKey);
      const teamRanking = rankings.find(r => r.team_key === FRC_TEAM_KEY);
      
      if (!teamRanking) return null;
      
      return {
        rank: teamRanking.rank,
        totalTeams: rankings.length,
        wins: teamRanking.wins,
        losses: teamRanking.losses,
        ties: teamRanking.ties
      };
    } catch (error) {
      console.error("Error getting team ranking:", error);
      return null;
    }
  }

  async getTeamMatches(eventKey: string): Promise<Match[]> {
    try {
      return await this.fetchAPI(`/team/${FRC_TEAM_KEY}/event/${eventKey}/matches/simple`);
    } catch (error) {
      console.error("Error fetching team matches:", error);
      return [];
    }
  }
  async getNextMatch(eventKey: string): Promise<Match | null> {
    try {
      const matches = await this.getTeamMatches(eventKey);
      
      // Find unplayed matches
      const unplayed = matches.filter(match => !match.actual_time);
      
      if (unplayed.length === 0) return null;
      
      // Sort by predicted time and return the earliest
      unplayed.sort((a, b) => (a.predicted_time || 0) - (b.predicted_time || 0));
      return unplayed[0];
    } catch (error) {
      console.error("Error getting next match:", error);
      return null;
    }
  }

  async getCompetitionData(): Promise<CompetitionData | null> {
    try {
      const currentEvent = await this.getCurrentEvent();
      if (!currentEvent) {
        return {
          ranking: 0,
          totalTeams: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          nextMatch: null,
          eventName: "No active event"
        };
      }

      const [ranking, nextMatch] = await Promise.all([
        this.getTeamRanking(currentEvent.key),
        this.getNextMatch(currentEvent.key)
      ]);

      return {
        ranking: ranking?.rank || 0,
        totalTeams: ranking?.totalTeams || 0,
        wins: ranking?.wins || 0,
        losses: ranking?.losses || 0,
        ties: ranking?.ties || 0,
        nextMatch,
        eventName: currentEvent.name
      };
    } catch (error) {
      console.error("Error getting competition data:", error);
      return null;
    }
  }

  formatMatchTime(match: Match): string {
    if (!match.predicted_time) return "TBD";
    
    const matchTime = new Date(match.predicted_time * 1000);
    return matchTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  formatMatchName(match: Match): string {
    const typeMap: { [key: string]: string } = {
      'qm': 'Q',
      'ef': 'QF',
      'qf': 'QF', 
      'sf': 'SF',
      'f': 'F'
    };
    
    const type = typeMap[match.comp_level] || match.comp_level.toUpperCase();
    return `${type}${match.match_number}`;
  }

  getAllianceTeams(match: Match, alliance: 'blue' | 'red'): string {
    return match.alliances[alliance].team_keys
      .map(key => key.replace('frc', ''))
      .join(', ');
  }

  async fetchEventData(eventCode: string): Promise<any> {
    try {
      const response = await fetch(`${TBA_BASE_URL}/event/${eventCode}`, {
        headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching event: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching event data:", error);
      throw error;
    }
  }

  async fetchEventTeams(eventCode: string): Promise<any[]> {
    try {
      const response = await fetch(`${TBA_BASE_URL}/event/${eventCode}/teams`, {
        headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching event teams: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching event teams:", error);
      throw error;
    }
  }

  async fetchEventRankings(eventCode: string): Promise<any[]> {
    try {
      console.log(`Fetching rankings for event: ${eventCode}`);
      const response = await fetch(`${TBA_BASE_URL}/event/${eventCode}/rankings`, {
        headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching event rankings: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw rankings API response:', data);
      
      // The API returns { rankings: [...], sort_order_info: [...] }
      // We need to process the rankings array and map the data correctly
      if (data.rankings && Array.isArray(data.rankings)) {
        const processedRankings = data.rankings.map((ranking: any) => {
          console.log('Processing ranking:', ranking);
          return {
            rank: ranking.rank,
            team_key: ranking.team_key,
            wins: ranking.record?.wins || 0,
            losses: ranking.record?.losses || 0,
            ties: ranking.record?.ties || 0,
            ranking_points: ranking.sort_orders?.[0] || 0,
            qual_average: ranking.sort_orders?.[1] || 0,
            record: ranking.record || { wins: 0, losses: 0, ties: 0 },
            sort_orders: ranking.sort_orders || [],
            matches_played: ranking.matches_played || 0,
            dq: ranking.dq || 0,
            extra_stats: ranking.extra_stats || []
          };
        });
        
        console.log('Processed rankings:', processedRankings);
        return processedRankings;
      }
      
      // If no rankings data, return empty array
      console.log('No rankings data found in response');
      return [];
    } catch (error) {
      console.error("Error fetching event rankings:", error);
      throw error;
    }
  }

  /**
   * Fetch the full list of alliances for a given event.
   * @param eventCode The event key, e.g. "2024mimid"
   * @returns Array of alliance objects in seed order (element 0 = #1 alliance)
   */
  async fetchEventAlliances(eventCode: string): Promise<any[]> {
    try {
      const response = await fetch(`${TBA_BASE_URL}/event/${eventCode}/alliances`, {
        headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
      });

      if (!response.ok) {
        throw new Error(`Error fetching event alliances: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching event alliances:", error);
      throw error;
    }
  }

  async fetchEventMatches(eventCode: string): Promise<any[]> {
    try {
      const response = await fetch(`${TBA_BASE_URL}/event/${eventCode}/matches`, {
        headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching event matches: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching event matches:", error);
      throw error;
    }
  }

  /* ---------------------- District-specific endpoints ---------------------- */

  /**
   * Fetch the district rankings list.
   * @param districtKey Full district key, e.g. "2025fim"
   */
  async fetchDistrictRankings(districtKey: string): Promise<any[]> {
    try {
      const response = await fetch(`${TBA_BASE_URL}/district/${districtKey}/rankings`, {
        headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY },
      });
      if (!response.ok) {
        throw new Error(`Error fetching district rankings: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching district rankings:", error);
      throw error;
    }
  }

  /**
   * Fetch all events in a district.
   * @param districtKey Full district key, e.g. "2025fim"
   */
  async fetchDistrictEvents(districtKey: string): Promise<any[]> {
    try {
      const response = await fetch(`${TBA_BASE_URL}/district/${districtKey}/events`, {
        headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY },
      });
      if (!response.ok) {
        throw new Error(`Error fetching district events: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching district events:", error);
      throw error;
    }
  }

  /**
   * Fetch regional advancement rankings for a given season year.
   * @param year Four-digit season year, e.g. "2025"
   */
  async fetchRegionalRankings(year: string): Promise<any[]> {
    try {
      const response = await fetch(`${TBA_BASE_URL}/regional_advancement/${year}/rankings`, {
        headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
      });
      if (!response.ok) {
        throw new Error(`Error fetching regional rankings: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching regional rankings:", error);
      throw error;
    }
  }

  /**
   * Fetch all regional events for a season year.
   * @param year Four-digit year
   */
  async fetchSeasonRegionalEvents(year: string): Promise<any[]> {
    try {
      const events: any[] = await this.fetchAPI(`/events/${year}/simple`);
      // event_type 0 indicates Regional, 99 preseason handled
      return events.filter(e => e.event_type === 0);
    } catch (error) {
      console.error("Error fetching regional events:", error);
      throw error;
    }
  }

  /* ------------------------- Event-specific endpoints ---------------------- */
  async fetchEventAwards(eventCode: string): Promise<any[]> {
    try {
      const response = await fetch(`${TBA_BASE_URL}/event/${eventCode}/awards`, {
        headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching event awards: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching event awards:", error);
      throw error;
    }
  }

  async fetchStatboticsEPA(eventCode: string, progressCallback?: (epaMap: { [teamKey: string]: number }) => void): Promise<{ [teamKey: string]: number }> {
    try {
      console.log('Fetching EPA data from Statbotics for event:', eventCode);
      
      // First get the teams at this event from our existing TBA data
      const eventTeams = await this.fetchEventTeams(eventCode);
      console.log(`Found ${eventTeams.length} teams at event`);
      
      if (eventTeams.length === 0) {
        console.log('No teams found for event, cannot fetch EPA data');
        return {};
      }
      
      // Use Statbotics v3 API - /team_event/{teamNumber}/{eventKey}
      const STATBOTICS_BASE_URL = 'https://api.statbotics.io/v3';
      const epaMap: { [teamKey: string]: number } = {};
      
      // Process all teams concurrently for maximum speed
      const allPromises = eventTeams.map(async (team) => {
        try {
          const teamNumber = team.team_number;
          const url = `${STATBOTICS_BASE_URL}/team_event/${teamNumber}/${eventCode}`;
          
          const response = await fetch(url);
          
          if (response.ok) {
            const teamEventData = await response.json();
            
            // Extract EPA from the response
            if (teamEventData && teamEventData.epa && teamEventData.epa.total_points) {
              const epaValue = teamEventData.epa.total_points.mean;
              if (epaValue !== null && epaValue !== undefined) {
                epaMap[`frc${teamNumber}`] = epaValue;
                // Call progress callback if provided for incremental updates
                if (progressCallback) {
                  progressCallback({ ...epaMap });
                }
              }
            }
          }
        } catch (error) {
          // Silently fail for individual teams to not slow down the rest
        }
      });
      
      // Wait for all requests to complete
      await Promise.all(allPromises);
      
      console.log(`Successfully fetched EPA for ${Object.keys(epaMap).length}/${eventTeams.length} teams`);
      return epaMap;
      
    } catch (error) {
      console.error("Error fetching EPA data:", error);
      return {};
    }
  }
}

// Export singleton instance
export const frcAPI = FRCAPIService.getInstance();
