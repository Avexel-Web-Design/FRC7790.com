/*
 * FRC API Module 8 - Schedule Management & Event Status
 * 
 * This file handles schedule page functionality, event countdown timers,
 * and real-time competition status updates. Includes functions to check
 * event phases (upcoming, active, completed) and render appropriate UI.
 */

// Add this at the end of the file to handle event states on schedule page
  if (window.location.pathname.includes('schedule.html')) {
    document.addEventListener('DOMContentLoaded', async function() {
      // List of event codes to check (all four events on the schedule page)
      const eventCodes = ['2025milac', '2025mitvc', '2025micmp4', '2025mil'];
      const countdownTimers = [];
      
      for (const eventCode of eventCodes) {
        try {
          // Skip processing events with hardcoded results - now including Traverse City
          if (eventCode === '2025micmp4' || eventCode === '2025milac' || eventCode === '2025mitvc') {
            console.log(`Skipping ${eventCode} processing - using hardcoded results`);
            continue;
          }
          
          // Fetch event data
          const eventData = await fetchEventData(eventCode);
          
          if (eventData) {
            const hasStarted = hasEventStarted(eventData.start_date);
            const hasEnded = hasEventEnded(eventData.end_date);
            
            // Get elements for this event based on event code
            let eventSelector;
            if (eventCode === '2025mil') {
              // FIRST Championship uses external link
              eventSelector = `a[href="event.html?event=2025mil"]`;
            } else if (eventCode === '2025milac') {
              // Lake City Regional - explicitly set the selector
              eventSelector = `a[href="event.html?event=2025milac"]`;
            } else if (eventCode === '2025mitvc') {
              // Traverse City Regional
              eventSelector = `a[href="event.html?event=2025mitvc"]`;
            } else if (eventCode === '2025micmp4') {
              // FIM District Championship
              eventSelector = `a[href="event.html?event=2025micmp4"]`;
            } else {
              // Default selector pattern
              eventSelector = `a[href="event.html?event=${eventCode}"]`;
            }
            
            // Find the countdown section and live updates section
            const liveUpdates = document.querySelector(`${eventSelector} #live-updates`);
            const countdownSection = document.querySelector(`${eventSelector} #countdown-section`);
            
            // Create sections if they don't exist
            if (!liveUpdates || !countdownSection) {
              // Find the event card
              const eventCard = document.querySelector(eventSelector);
              if (eventCard) {
                const cardBody = eventCard.querySelector('.card-gradient');
                if (cardBody) {
                  // Check if sections already exist
                  if (!cardBody.querySelector('#live-updates')) {
                    // Create live updates section
                    const updatesSection = document.createElement('div');
                    updatesSection.id = 'live-updates';
                    updatesSection.className = 'mt-6 hidden';
                    updatesSection.innerHTML = `
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <!-- Current Ranking -->
                        <div class="p-4 bg-black/30 rounded-lg flex flex-col items-center">
                          <h4 class="text-lg font-semibold mb-2">Current Ranking</h4>
                          <div class="flex items-center justify-center gap-2">
                            <span id="ranking-number" class="text-4xl font-bold text-baywatch-orange">--</span>
                            <span class="text-xl text-gray-400">th</span>
                          </div>
                          <span class="text-gray-400 block mt-1" id="total-teams">Loading...</span>
                        </div>
  
                        <!-- Win/Loss Record -->
                        <div class="p-4 bg-black/30 rounded-lg flex flex-col items-center">
                          <h4 class="text-lg font-semibold mb-2">Event Record</h4>
                          <div class="flex justify-center items-center gap-4">
                            <div class="text-center">
                              <span id="wins" class="text-3xl font-bold text-green-500 counter">--</span>
                              <span class="text-gray-400 block">Wins</span>
                            </div>
                            <span class="text-xl text-gray-400">-</span>
                            <div class="text-center">
                              <span id="losses" class="text-3xl font-bold text-red-500 counter">--</span>
                              <span class="text-gray-400 block">Losses</span>
                            </div>
                          </div>
                        </div>
  
                        <!-- Next Match -->
                        <div class="p-4 bg-black/30 rounded-lg flex flex-col items-center">
                          <h4 class="text-lg font-semibold mb-2">Next Match</h4>
                          <div class="text-center">
                            <span id="match-number" class="text-2xl font-bold text-baywatch-orange">Loading...</span>
                            <div id="match-time" class="text-gray-400 mt-1">--:-- --</div>
                            <div class="mt-2 flex justify-center gap-2">
                              <div id="blue-alliance" class="text-xs px-2 py-1 bg-blue-500/20 rounded-full text-blue-400">
                                Loading...
                              </div>
                              <div id="red-alliance" class="text-xs px-2 py-1 bg-red-500/20 rounded-full text-red-400">
                                Loading...
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    `;
                    cardBody.appendChild(updatesSection);
                  }
                  
                  if (!cardBody.querySelector('#countdown-section')) {
                    // Create countdown section
                    const countdownSection = document.createElement('div');
                    countdownSection.id = 'countdown-section';
                    countdownSection.className = 'mt-6 flex flex-col items-center';
                    countdownSection.innerHTML = `
                      <div class="text-center">
                        <h4 class="text-lg font-semibold mb-2">Event Countdown</h4>
                        <div id="countdown-timer" class="text-4xl font-bold text-baywatch-orange">
                          --d --h --m --s
                        </div>
                        <p class="text-gray-400 text-sm mt-2">
                          Live match updates will appear here when the event starts
                        </p>
                      </div>
                    `;
                    cardBody.appendChild(countdownSection);
                  }
                }
              }
            }
            
            // Now get the elements again after potentially creating them
            const updatedLiveUpdates = document.querySelector(`${eventSelector} #live-updates`);
            const updatedCountdownSection = document.querySelector(`${eventSelector} #countdown-section`);
            
            if (updatedLiveUpdates && updatedCountdownSection) {
              if (hasEnded) {
                // Event has ended - show results view
                updatedCountdownSection.classList.add('hidden');
                updatedLiveUpdates.classList.remove('hidden');
                
                // Convert to results display with 3 sections
                updatedLiveUpdates.querySelector('.grid').className = 'grid grid-cols-1 md:grid-cols-3 gap-4 text-center';
  
                // Update with "Event Complete" indicator and enhanced results
                const rankingSection = updatedLiveUpdates.querySelector('.p-4:first-child');
                if (rankingSection) {
                  rankingSection.innerHTML = `
                    <h4 class="text-lg font-semibold mb-2">Final Ranking</h4>
                    <div class="flex items-center justify-center gap-1">
                      <span id="ranking-number" class="text-4xl font-bold text-baywatch-orange animate__animated animate__fadeIn">--</span>
                      <span class="text-sm text-gray-400 self-end mb-1">th</span>
                    </div>
                    <div id="qual-record" class="text-sm text-gray-400 mt-1">--W--L--T</div>
                  `;
                }
  
                // Swapping the alliance and playoff sections
                // First, let's create the alliance section (which was previously in nextMatchSection)
                const allianceSection = document.createElement('div');
                allianceSection.className = 'p-4 bg-black/30 rounded-lg flex flex-col items-center';
                allianceSection.innerHTML = `
                  <h4 class="text-lg font-semibold mb-2">Alliance</h4>
                  <div class="text-center">
                    <div id="alliance-number" class="text-4xl font-bold text-baywatch-orange mb-1">--</div>
                    <div id="alliance-pick" class="text-sm text-gray-400 mb-1">--</div>
                  </div>
                `;
  
                // Now, let's update the nextMatchSection to be the playoff section
                const nextMatchSection = updatedLiveUpdates.querySelector('.p-4:last-child');
                if (nextMatchSection) {
                  nextMatchSection.innerHTML = `
                    <h4 class="text-lg font-semibold mb-2">Playoffs</h4>
                    <div class="text-center">
                      <div id="playoff-result" class="text-4xl font-bold text-baywatch-orange">
                        <i class="fas fa-spinner fa-spin"></i>
                      </div>
                      <div id="playoff-record" class="text-sm text-gray-400 mt-1">
                        Loading playoff data...
                      </div>
                    </div>
                  `;
                }
  
                // Update the grid container with the new order: ranking, alliance, playoffs
                const gridContainer = updatedLiveUpdates.querySelector('.grid');
                if (gridContainer) {
                  // Clear current children except the first one (ranking)
                  while (gridContainer.children.length > 1) {
                    gridContainer.removeChild(gridContainer.lastChild);
                  }
                  
                  // Add alliance section and playoff section in that order
                  gridContainer.appendChild(allianceSection);
                  gridContainer.appendChild(nextMatchSection);
                }
  
                // Add event status indicator at the top
                const eventStatusIndicator = document.createElement('div');
                eventStatusIndicator.className = 'mb-4 text-center';
                updatedLiveUpdates.insertBefore(eventStatusIndicator, updatedLiveUpdates.firstChild);
  
                // Only fetch final results for events we actually attended
                if (eventCode !== '2025mil' && eventCode !== '2025micmp4') {
                  // Fetch team status at event for ranking & record
                  fetchTeamStatusAtEvent(eventCode, '7790').then(status => {
                    if (status) {
                      // Update qualification ranking
                      const rankEl = updatedLiveUpdates.querySelector('#ranking-number');
                      const recordEl = updatedLiveUpdates.querySelector('#qual-record');
                      
                      if (status.qual && status.qual.ranking) {
                        const ranking = status.qual.ranking;
                        if (rankEl) rankEl.textContent = ranking.rank || '--';
                        
                        // Update suffix using the formatRankSuffix function
                        const rankSuffix = updatedLiveUpdates.querySelector('#ranking-number + span');
                        if (rankSuffix && window.formatRankSuffix && ranking.rank) {
                          rankSuffix.textContent = window.formatRankSuffix(ranking.rank);
                        }
                        
                        if (recordEl) {
                          recordEl.textContent = `${ranking.record ? ranking.record.wins : '--'}-${ranking.record ? ranking.record.losses : '--'}-${ranking.record ? ranking.record.ties : '--'}`;
                        }
                      }
                      
                      // Update alliance selection info - now with alliance number as main focus
                      const allianceNumberEl = updatedLiveUpdates.querySelector('#alliance-number');
                      const alliancePickEl = updatedLiveUpdates.querySelector('#alliance-pick');
                      const partnersEl = updatedLiveUpdates.querySelector('#alliance-partners');
                      
                      if (status.alliance) {
                        const pickNumber = status.alliance.pick;
                        
                        // Fix: Ensure we set the alliance number even when not available in playoff data
                        if (allianceNumberEl) {
                          if (status.playoff && status.playoff.alliance) {
                            const allianceNumber = status.playoff.alliance;
                            allianceNumberEl.textContent = `${allianceNumber}`;
                          } else {
                            // Calculate alliance number from status.alliance.number if available, or from picks index
                            const allianceNumber = status.alliance.number !== undefined ? 
                                                  status.alliance.number : 
                                                  Math.floor(status.alliance.picks.indexOf('frc7790') / 3) + 1;
                            allianceNumberEl.textContent = `${allianceNumber}`;
                          }
                        }
                        
                        // We were an alliance captain
                        if (pickNumber === 0) {
                          if (alliancePickEl) alliancePickEl.innerHTML = `<span class="text-yellow-500"><i class="fas fa-crown mr-1"></i>Captain</span>`;
                          if (partnersEl) {
                            // Fix: Ensure we're creating valid HTML with team numbers
                            const partnerTeams = status.alliance.picks.slice(1);
                            if (partnerTeams.length > 0) {
                              partnersEl.innerHTML = partnerTeams.map(team => 
                                `<span class="px-2 py-1 bg-black/30 rounded-full inline-block m-1">Team ${team.substring(3)}</span>`
                              ).join('');
                            } else {
                              partnersEl.textContent = "No alliance partners found";
                            }
                          }
                        } 
                        // We were picked
                        else {
                          if (alliancePickEl) alliancePickEl.textContent = `Pick ${pickNumber}`;
                          if (partnersEl) {
                            const allTeams = status.alliance.picks;
                          }
                        }
                      } else {
                        // Not selected for playoffs
                        if (allianceNumberEl) allianceNumberEl.innerHTML = `<i class="fas fa-times"></i>`;
                        if (alliancePickEl) alliancePickEl.textContent = '';
                        if (partnersEl) partnersEl.textContent = "Not selected for playoffs";
                      }
                      
                      // Update playoff results
                      const playoffResultEl = updatedLiveUpdates.querySelector('#playoff-result');
                      const playoffRecordEl = updatedLiveUpdates.querySelector('#playoff-record');
                      
                      if (status.playoff) {
                        const playoffStatus = status.playoff.status;
                        const playoffRecord = status.playoff.record;
                        const playoffLevel = status.playoff.level;
                        const allianceNumber = status.playoff.alliance;
                        
                        let resultText = '';
                        let resultClass = '';
                        
                        // Determine playoff result text and color
                        if (playoffStatus === 'won') {
                          resultText = '1st Place';
                          resultClass = 'text-yellow-500';
                        } else if (playoffStatus === 'eliminated') {
                          // Get detailed playoff results to determine exact placement
                          fetchDetailedPlayoffResults(eventCode, status).then(detailedResult => {
                            const { placementText, placementClass } = detailedResult;
                            
                            // Update the playoff result with the precise placement
                            if (playoffResultEl) {
                              playoffResultEl.className = `text-4xl font-bold ${placementClass}`;
                              playoffResultEl.textContent = placementText;
                            }
                          }).catch(() => {
                            // Fallback to basic placement if we can't get detailed results
                            const { placementText, placementClass } = determinePlayoffPlacement(playoffLevel, allianceNumber);
                            
                            if (playoffResultEl) {
                              playoffResultEl.className = `text-4xl font-bold ${placementClass}`;
                              playoffResultEl.textContent = placementText;
                            }
                          });
                          
                          // Set a temporary placement while we wait for the detailed results
                          const { placementText, placementClass } = determinePlayoffPlacement(playoffLevel, allianceNumber);
                          resultText = placementText;
                          resultClass = placementClass;
                        } else if (playoffStatus === 'playing') {
                          resultText = 'In Progress';
                          resultClass = 'text-baywatch-orange';
                        } else {
                          // Handle undefined or unknown status
                          resultText = playoffStatus || 'Unknown';
                          resultClass = 'text-gray-400';
                        }
                        
                        if (playoffResultEl) {
                          playoffResultEl.className = `text-4xl font-bold ${resultClass}`;
                          playoffResultEl.textContent = resultText;
                        }
                        
                        if (playoffRecordEl && playoffRecord) {
                          playoffRecordEl.textContent = `${playoffRecord.wins || 0}-${playoffRecord.losses || 0}-${playoffRecord.ties || 0}`;
                          
                          // Add stage reached info below the record
                          if (playoffLevel) {
                            const stageText = getPlayoffStageName(playoffLevel);
                            if (stageText) {
                              const stageEl = document.createElement('div');
                              stageEl.className = 'text-sm text-gray-400 mt-1';
                              playoffRecordEl.parentNode.appendChild(stageEl);
                            }
                          }
                        } else if (playoffRecordEl) {
                          // Fix: Handle missing record data
                          playoffRecordEl.textContent = "Record unavailable";
                        }
                      } else {
                        // No playoff data
                        if (playoffResultEl) playoffResultEl.innerHTML = `<i class="fas fa-minus"></i>`;
                        if (playoffRecordEl) playoffRecordEl.textContent = "Did not participate";
                      }
  
                      // Fix: Add debug output to console to verify data
                      console.log(`Event ${eventCode} status data:`, status);
                    } else {
                      // Fix: Handle null status with fallback display
                      setFallbackEventDisplay(updatedLiveUpdates, eventCode);
                    }
                  }).catch(err => {
                    console.error('Error fetching team status:', err);
                    // Fix: Handle error with fallback display
                    setFallbackEventDisplay(updatedLiveUpdates, eventCode);
                  });
                  
                  // Also fetch event awards to check for any awards won
                  fetchEventAwards(eventCode).then(awards => {
                    const teamAwards = awards.filter(award => 
                      award.recipient_list.some(recipient => recipient.team_key === 'frc7790')
                    );
                    
                    if (teamAwards.length > 0) {
                      // Create awards section if we won any awards
                      const awardsIndicator = document.createElement('div');
                      awardsIndicator.className = 'mt-4 text-center';
                      awardsIndicator.innerHTML = `
                        <div class="text-yellow-500 mb-2"><i class="fas fa-award mr-1"></i> Awards</div>
                        <div class="flex flex-wrap justify-center gap-2">
                          ${teamAwards.map(award => 
                            `<div class="px-3 py-1 bg-yellow-500/20 rounded-full text-yellow-400 text-sm">
                              ${award.name}
                            </div>`
                          ).join('')}
                        </div>
                      `;
                      updatedLiveUpdates.appendChild(awardsIndicator);
                    }
                  }).catch(err => console.error('Error fetching event awards:', err));
                } else {
                  // Fix: For events we're not expected to attend, show appropriate message
                  setQualificationPendingDisplay(updatedLiveUpdates);
                }
              } else if (hasStarted) {
                // Event is ongoing - show live updates
                updatedCountdownSection.classList.add('hidden');
                updatedLiveUpdates.classList.remove('hidden');
                
                // For ongoing events, we could fetch live data here
                if (eventCode !== '2025mil') {
                  fetchTeamStatusAtEvent(eventCode, '7790').then(status => {
                    const rankEl = updatedLiveUpdates.querySelector('#ranking-number');
                    if (status && status.qual && status.qual.ranking && rankEl) {
                      rankEl.textContent = status.qual.ranking.rank || '--';
                      
                      const totalEl = updatedLiveUpdates.querySelector('#total-teams');
                      if (totalEl) {
                        totalEl.textContent = `of ${status.qual.num_teams} teams`;
                      }
                    }
                  }).catch(err => console.error('Error fetching team status:', err));
                }
              } else {
                // Event hasn't started - show countdown
                updatedCountdownSection.classList.remove('hidden');
                updatedLiveUpdates.classList.add('hidden');
                
                // Get the countdown container for this event
                const countdownTimer = updatedCountdownSection.querySelector('#countdown-timer');
                if (countdownTimer) {
                  // Get the event-specific offset instead of using hardcoded 37 hours
                  const eventOffset = window.getOffsetForEvent ? 
                      window.getOffsetForEvent(eventCode) : 
                      (37 * 3600 * 1000); // fallback to 37 hours if global function not available
                  
                  // Calculate countdown with event-specific offset
                  const startWithOffset = new Date(eventData.start_date);
                  startWithOffset.setTime(startWithOffset.getTime() + eventOffset);
                  
                  // Store target date as data attribute and add to timers array
                  countdownTimer.dataset.targetDate = startWithOffset.getTime();
                  countdownTimers.push(countdownTimer);
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error checking event status for ${eventCode}:`, error);
        }
      }
      
      // Set up a single global interval for all countdown timers
      if (countdownTimers.length > 0) {
        // Initial update for all timers
        updateAllCountdownTimers(countdownTimers);
        
        // Set a single interval to update all timers synchronously
        const globalCountdownInterval = setInterval(() => {
          const allComplete = updateAllCountdownTimers(countdownTimers);
          
          // If all countdowns are complete, clear the interval
          if (allComplete) {
            clearInterval(globalCountdownInterval);
            // Reload page to update the view
            window.location.reload();
          }
        }, 1000);
      }
    });
  }
  
  // Function to update all countdown timers at once
  function updateAllCountdownTimers(timers) {
    const now = new Date();
    let allComplete = true;
    
    timers.forEach(timer => {
      const targetTime = parseInt(timer.dataset.targetDate);
      const timeLeft = targetTime - now;
      
      if (timeLeft <= 0) {
        timer.textContent = '0d 00h 00m 00s';
      } else {
        allComplete = false;
        
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        timer.textContent = `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
      }
    });
    
    return allComplete;
  }
  
  // Helper function to update countdown display for a specific timer
  // Note: This function is kept for compatibility with other parts of the code
  function updateCountdownDisplay(timerElement, targetDate) {
    const now = new Date();
    const timeLeft = targetDate - now;
    
    if (timeLeft <= 0) {
      timerElement.textContent = '0d 00h 00m 00s';
      return;
    }
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    timerElement.textContent = `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }