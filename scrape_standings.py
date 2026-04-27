from bs4 import BeautifulSoup
import requests
import csv

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}   
page = requests.get('https://www.formula1.com/en/results/2026/drivers', headers=headers)
soup = BeautifulSoup(page.content, 'html.parser')
#print(soup)

output = []


table = soup.find('table')
head = table.find('thead')
ths = head.find_all('th')

headers = []
for th in ths:
    print(th.text.strip())
    headers.append(th.text.strip())
output.append(headers)


body = table.find('tbody')
rows = body.find_all('tr')
for row in rows:
    row_data = []
    data = row.find_all('td')
    for datum in data[0:1]:
        print(datum.text.strip())
        row_data.append(datum.text.strip())
    for datum in data[1:2]:
        spans = datum.find_all('span')
        spans = spans[1].find_all('span')
        string = ""
        for span in spans[0:2]:
            string += span.text.strip() + " "
        string = string.strip()
        print(string)
        row_data.append(string)
    for datum in data[2:]:
        print(datum.text.strip())
        row_data.append(datum.text.strip())
    output.append(row_data)
print(output)

csv.writer(open('standings.csv', 'w', newline='')).writerows(output)



