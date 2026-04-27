from bs4 import BeautifulSoup
import requests
import csv

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}   
page = requests.get('https://www.formula1.com/en/teams', headers=headers)
soup = BeautifulSoup(page.content, 'html.parser')

all_div = soup.find('div', attrs={'class': 'grid grid-cols-1 @[680px]/page:grid-cols-2 gap-px-16 lg:gap-px-24'})
teams= all_div.find_all('a')
print(len(teams))


teams_data = []


data_headers = ['Name', 'Driver1', 'Driver2',
'Grand Prixs','Total Points','Highest Race Finish',
'Podiums','Highest Grid Position','Pole Positions','World Championships']

teams_data.append(data_headers)


def get_team_info(url):
    team_info = []
    page = requests.get(url, headers=headers)
    soup = BeautifulSoup(page.content, 'html.parser')
    

    h1 = soup.find('h1')
    print(h1.text.strip())
    team_info.append(h1.text.strip())

    drivers_div = soup.find('div', attrs={'class': 'relative z-40 grid grid-cols-[1fr,1px,1fr] gap-px-12 min-h-[20px]'})
    spans = drivers_div.find_all('span')
    print(spans[0].text.strip())
    team_info.append(spans[0].text.strip())

    print(spans[2].text.strip())
    team_info.append(spans[2].text.strip())


    stats_div = soup.find('div', attrs={'class': 'order-3 lg:order-2'})
    stats = stats_div.find_all('div', attrs={'class': 'DataGrid-module_item__cs9Zd'})
    for stat in stats:
        dd = stat.find('dd')
        print(dd.text.split()[0].strip())
        team_info.append(dd.text.split()[0].strip())

    return team_info




for team in teams:
    url = 'https://www.formula1.com' + team['href']
    print(url)
    
    team_info = []

    team_info = get_team_info(url)
    teams_data.append(team_info)


print(teams_data)

with open('teams_data.csv', 'w', newline='') as file:
    writer = csv.writer(file)
    writer.writerows(teams_data)