from bs4 import BeautifulSoup
import requests
import csv

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}   
page = requests.get('https://www.formula1.com/en/drivers', headers=headers)
soup = BeautifulSoup(page.content, 'html.parser')

all_div = soup.find('div', attrs={'class': 'grid grid-cols-1 @[680px]/page:grid-cols-2 @[1660px]/page:grid-cols-4 gap-px-16 lg:gap-px-24'})
drivers = all_div.find_all('div', attrs={'data-f1rd-a7s-click': 'driver_card_click'})
print(len(drivers))


drivers_data = []


data_headers = ['Name', 'Nationality', "Team", 'Number',
'Grand Prixs','Career Points','Highest Race Finish',
'Podiums','Highest Grid Position','Pole Positions','World Championships',
'DNFs']

drivers_data.append(data_headers)

def get_driver_info(url):
    driver_info = []
    page = requests.get(url, headers=headers)
    soup = BeautifulSoup(page.content, 'html.parser')
    
    
    h1 = soup.find('h1')
    spans = h1.find_all('span')
    name = spans[1].text.strip() + " " + spans[2].text.strip()
    print(name)
    driver_info.append(name)

    info_div = soup.find('div', attrs={'class': 'flex gap-px-12 items-center'})
    ps = info_div.find_all('p')
    print(len(ps))
    for p in ps:
        print(p.text.strip())
        driver_info.append(p.text.strip())

    stats_div = soup.find('div', attrs={'class': 'order-3 lg:order-2'})
    stats = stats_div.find_all('div', attrs={'class': 'DataGrid-module_item__cs9Zd'})
    for stat in stats:
        dd = stat.find('dd')
        print(dd.text.split()[0].strip())
        driver_info.append(dd.text.split()[0].strip())

    return driver_info
    



for driver in drivers:
    a = driver.find('a')
    url = 'https://www.formula1.com' + a['href']
    driver_info = get_driver_info(url)
    drivers_data.append(driver_info)

'''
with open('drivers_data.csv', 'w', newline='') as file:
    writer = csv.writer(file)
    writer.writerows(drivers_data)
'''