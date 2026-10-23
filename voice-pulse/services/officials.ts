import type { Official } from '../types';

const rosterCsv = `FirstName,LastName,LeadershipPositionCurrent,Party,Phone,Room,District,YearEnter,Floor,Gender,HomeTown
Bill,Allen,,Republican,573-751-1218,235-BA,017,2022,2,M,Kansas City
Phil,Amato,,Republican,573-751-2504,201-B,113,2022,2,M,Arnold
Marlon,Anderson,Assistant Minority Floor Leader,Democrat,573-751-7605,134,076,2020,1,M,St. Louis
LaDonna,Appelbaum,,Democrat,573-751-4183,101-A,071,2018,1,F,St. Louis
Ashley,Aune,Minority Floor Leader,Democrat,573-751-3618,204,014,2020,2,F,Kansas City
Brad,Banderman,,Republican,573-751-0549,235,119,2022,2,M,St. Clair
Donna,Barnes,,Democrat,573-751-9851,130-DB,028,2024,1,F,Raytown
Hardy,Billington,Majority Whip,Republican,573-751-4039,303-B,152,2018,3,M,Poplar Bluff
John,Black,,Republican,573-751-1167,403-B,129,2018,4,M,Marshfield
Mitch,Boggs,,Republican,573-751-4077,113,157,2020,1,M,LaRussell
LaKeySha,Bosley,,Democrat,573-751-6800,200-BC,079,2018,2,F,St. Louis
Stephanie,Boykin,,Democrat,573-751-4163,105-J,070,2024,1,F,Florissant
Mark,Boyko,,Democrat,573-751-4069,101-K,090,2024,1,M,Kirkwood
Bob,Bromley,,Republican,573-751-7082,401-A,162,2018,4,M,Carl Junction
Chris,Brown,,Republican,573-751-9458,302-1,016,2020,3,M,Kansas City
Michael,Burton,,Democrat,573-751-9472,105-C,092,2020,1,M,Lakeshire
Gregg,Bush,,Democrat,573-751-2134,109-E,050,2024,1,M,Columbia
Danny,Busick,,Republican,573-751-3647,412-C,003,2018,4,M,Newtown
Steve,Butz,,Democrat,573-751-0438,106-B,081,2018,1,M,St. Louis
Tricia,Byrnes,,Republican,573-751-1460,313-3,063,2022,3,F,Wentzville
David,Casteel,,Republican,573-751-3751,236-A,097,2022,2,M,High Ridge
Carolyn,Caton,,Republican,573-751-9766,115-D,033,2024,1,F,Blue Springs
Darin,Chappell,,Republican,573-751-3819,200-B,137,2022,2,M,Rogersville
Brad,Christ,,Republican,573-751-2150,415-B,096,2022,4,M,St. Louis
Mazzie,Christensen,,Republican,573-751-4285,404-B,002,2022,4,F,Bethany
Doug,Clemens,,Democrat,573-751-1832,105-B,072,2018,1,M,St. Ann
Jeff,Coleman,,Republican,573-751-1487,313-1,032,2018,3,M,Grain Valley
Kimberly-Ann,Collins,Minority Caucus Vice-Chair,Democrat,573-751-1400,201-BA,077,2020,2,F,St. Louis
Bennie,Cook,Majority Caucus Chair,Republican,573-751-2264,316,143,2020,3,M,Houston
Mike,Costlow,,Republican,573-751-3572,115-J,108,2024,1,M,Dardenne Prairie
Scott,Cupps,,Republican,573-751-1488,404-A,158,2019,4,M,Shell Knob
Bishop,Davidson,,Republican,573-751-2381,306-B,130,2020,3,M,Republic
Michael,Davis,,Republican,573-751-2175,110-B,056,2020,1,M,Belton
Jeremy,Dean,,Democrat,573-751-3795,103-BB,132,2024,1,M,Springfield
Dane,Diehl,,Republican,573-751-4065,114-B,125,2022,1,M,Butler
David,Dolan,,Republican,573-751-5471,116-2,148,2024,1,M,Sikeston
Jo,Doll,,Democrat,573-751-1285,101-C,091,2020,1,F,St. Louis
Melissa,Douglas,,Democrat,573-751-7639,135-AC,027,2024,1,F,Kansas City
Lisa,Durnell,,Republican,573-751-1455,115-C,154,2024,1,F,Willow Springs
Anthony,Ealy,,Democrat,573-751-9469,130-DC,036,2022,1,,Grandview
Keith,Elliott,,Republican,573-751-1066,115-B,153,2024,1,M,Doniphan
Bill,Falkner,,Republican,573-751-9755,206-A,010,2018,2,M,St. Joseph
Jeff,Farnan,,Republican,573-751-9465,410-A,001,2022,4,M,Stanberry
Betsy,Fogle,,Democrat,573-751-9809,109-A,135,2020,1,F,Springfield
Yolonda,Fountain Henderson,,Democrat,573-751-4468,105-G,085,2022,1,F,St. Louis
Ron,Fowler,,Republican,573-751-8636,116-A1,031,2024,1,M,Blue Springs
Elizabeth,Fuchs,,Democrat,573-751-6736,109-H,080,2024,1,F,St. Louis
Sherri,Gallick,,Republican,573-751-1344,300,062,2022,3,F,Belton
Jamie Ray,Gragg,,Republican,573-751-2565,412-A,140,2022,4,e,Ozark
Dave,Griffith,,Republican,573-751-2412,414,060,2018,4,M,Jefferson City
Kent,Haden,,Republican,573-751-3649,311,043,2018,3,M,Mexico
Jeff,Hales,,Democrat,573-751-4265,105-E,086,2024,1,e,St. Louis
Willard,Haley,,Republican,573-751-2077,234,058,2020,2,M,Eldon
Tony,Harbison,,Republican,573-751-2112,411-A,144,2024,4,M,Arcadia
Bill,Hardwick,,Republican,573-751-3834,205,121,2020,2,M,Dixon
Wendy L.,Hausman,,Republican,573-751-3717,408-A,065,2022,4,F,St. Peters
Stephanie,Hein,,Democrat,573-751-0232,109-F,136,2022,1,,Springfield
John,Hewkin,,Republican,573-751-1688,400,120,2024,4,M,Cuba
Dave,Hinman,,Republican,573-751-2176,317-B,103,2022,3,M,O'Fallon
Barry,Hovis,,Republican,573-751-6662,304-B,146,2018,3,M,Whitewater
George,Hruza,,Republican,573-751-1544,201-G,089,2024,2,M,St. Louis
Josh,Hurlbert,,Republican,573-751-0246,233-A,008,2020,2,M,Smithville
Keri,Ingle,,Democrat,573-751-1459,109-C,035,2018,1,F,Lee's Summit
Bill,Irwin,,Republican,573-751-3783,118-CB,055,2024,1,M,Lees Summit
Martin,Jacobs,,Democrat,573-751-2238,101-H,038,2024,1,M,Liberty
Ken,Jamison,,Democrat,573-751-4787,101-G,015,2024,1,M,Gladstone
Will,Jobe,,Democrat,573-751-5701,101-F,021,2024,1,M,Independence
Michael,Johnson,,Democrat,573-751-0538,105-F,023,2020,1,M,Kansas City
Holly,Jones,,Republican,573-751-7535,203-B,088,2022,2,F,Eureka
Mike,Jones,,Republican,573-751-9760,116-4,012,2024,1,M,Kansas City
Steve,Jordan,,Republican,573-751-1494,115-G,151,2024,1,M,Advance
Doyle,Justus,,Republican,573-751-9459,114-C,041,2022,1,M,Troy
Jim,Kalberloh,,Republican,573-751-5388,410-B,126,2020,4,M,Lowry City
Ben,Keathley,,Republican,573-751-1247,112,101,2022,1,M,Chesterfield
Ann,Kelley,Majority Caucus Secretary,Republican,573-751-2165,401-B,127,2018,4,F,Lamar
Nick,Kimble,,Democrat,573-751-4220,106-A,082,2024,1,M,St. Louis
Jeff,Knight,,Republican,573-751-1490,413-A,142,2018,4,M,Lebanon
Becky,Laubinger,,Republican,573-751-2317,201-E,117,2024,2,F,Park Hills
Ed,Lewis,,Republican,573-751-6566,312,006,2020,3,M,Moberly
Cathy Jo,Loy,,Republican,573-751-5458,201-F,163,2024,2,F,Carthage
Bill,Lucas,,Republican,573-751-7735,409-A,115,2024,4,M,DeSoto
Pattie,Mansur,,Democrat,573-751-2437,102-BB,025,2024,1,F,Kansas City
John,Martin,,Republican,573-751-1169,201-D,044,2024,2,M,Columbia
Mark,Matthiesen,,Republican,573-751-1470,207-B,107,2016,2,M,O'Fallon
Don,Mayhew,,Republican,573-751-3604,412-B,124,2018,4,M,Crocker
Peggy,McGaugh,,Republican,573-751-2917,402,007,2018,4,F,Carrollton
Mike,McGirl,,Republican,573-751-2398,303,118,2018,3,M,Potosi
Mark,Meirath,,Republican,573-751-1468,116-5,039,2024,1,M,Excelsior Springs
Scott,Miller,,Republican,573-751-5365,115-E,069,2024,1,M,St. Charles
Chanel,Mosley,,Democrat,573-751-5538,105-I,075,2024,1,F,Black Jack
Jim,Murphy,,Republican,573-751-3719,407-B,094,2018,4,M,St. Louis
Marty Joe,Murray,,Democrat,573-751-2383,135-AB,078,2024,1,M,St. Louis
Jeff,Myers,,Republican,573-751-2689,405-B,042,2022,4,M,Warrenton
Mark,Nolte,,Republican,573-751-2204,115-I,051,2024,1,M,Higginsville
Philip,Oehlerking,,Republican,573-751-9765,314,100,2022,3,M,Ballwin
Matthew,Overcast,,Republican,573-751-2042,115-H,155,2024,1,M,Ava
Bill,Owen,,Republican,573-751-2948,309,131,2020,3,e,Springfield
Cameron,Parker,,Republican,573-751-3629,305-A,150,2022,3,F,Campbell
Jonathan,Patterson,Speaker of the House,Republican,573-751-0907,308,030,2018,3,M,Lees Summit
Chad,Perkins,Speaker Pro Tem,Republican,573-751-4028,301,040,2020,3,M,Bowling Green
Tara,Peters,,Republican,573-751-1446,315,122,2022,3,F,Rolla
Brandon,Phelps,,Republican,573-751-3850,116-3,054,2024,1,M,Warrensburg
Adrian,Plank,,Democrat,573-751-1501,101-B,047,2022,1,M,Columbia
Brad,Pollitt,,Republican,573-751-9774,413-B,052,2018,4,M,Sedalia
Sean,Pouche,,Republican,573-751-6593,233-B,013,2020,2,M,Kansas City
Tiffany,Price,,Democrat,573-751-2124,101-J,026,2024,1,F,Kansas City
Raychel,Proudie,,Democrat,573-751-0855,135,073,2018,1,F,Ferguson
Ray,Reed,,Democrat,573-751-2883,103-BA,083,2024,1,M,St. Louis
Rodger,Reedy,,Republican,573-751-3971,411-2,057,2018,4,M,Windsor
Renee,Reuter,,Republican,573-751-3607,235-BB,112,2022,2,F,Imperial
Louis,Riggs,,Republican,573-751-3613,313-2,005,2018,3,M,Hannibal
Alex,Riley,Majority Floor Leader,Republican,573-751-2210,302-A,134,2020,3,M,Springfield
Lane,Roberts,Assistant Majority Floor Leader,Republican,573-751-3791,302-B,161,2018,3,M,Joplin
Tonya,Rush,,Democrat,573-751-2135,109-D,067,2024,1,F,Florissant
Bruce,Sassmann,,Republican,573-751-6668,207-A,061,2020,2,M,Bland
Melissa,Schmidt,,Republican,573-751-2205,406-A,141,2024,4,F,Eldridge
Jim,Schulte,,Republican,573-751-5226,405-A,049,2022,4,M,New Bloomfield
Brian,Seitz,,Republican,573-751-1309,118-CA,156,2020,1,M,Branson
Deanna,Self,,Republican,573-751-1484,406-B,064,2024,4,F,St. Paul
Mark,Sharp,,Democrat,573-751-0238,102-BA,037,2019,1,M,Kansas City
Greg,Sharpe,,Republican,573-751-3644,206-B,004,2018,2,M,Ewing
Brenda,Shields,,Republican,573-751-3643,407-A,011,2018,4,F,St. Joseph
John,Simmons,,Republican,573-751-3776,408-B,109,2024,4,M,Washington
David Tyson,Smith,,Democrat,573-751-9753,105-H,046,2021,1,,Columbia
Kem,Smith,,Democrat,573-751-9628,135-BB,068,2024,1,F,Florissant
Marla,Smith,,Democrat,573-751-4726,103-BC,074,2024,1,F,St. Louis
Kathy,Steinhoff,,Democrat,573-751-4189,135-BA,045,2022,1,F,Columbia
Connie,Steinmetz,,Democrat,573-751-0100,135-BC,087,2024,1,F,Maryland Heights
Mike,Steinmeyer,,Republican,573-751-3674,116-A2,020,2024,1,M,Sugar Creek
Melanie,Stinnett,,Republican,573-751-0136,203-C,133,2022,2,F,Springfield
Kemp,Strickler,,Democrat,573-751-1456,101-I,034,2022,1,M,Lee's Summit
Del,Taylor,,Democrat,573-751-2198,130-DA,084,2022,1,M,St. Louis
Tim,Taylor,,Republican,573-751-0169,304-A,048,2020,3,M,Bunceton
Marlene,Terry,,Democrat,573-751-6845,101-E,066,2020,1,F,St Louis
Wick,Thomas,,Democrat,573-751-3310,135-AA,019,2024,1,M,Kansas City
Terry,Thompson,,Republican,573-751-1462,411-B,053,2020,4,M,Lexington
Bob,Titus,,Republican,573-751-3833,306-A,139,2022,3,M,Billings
Dean,Van Schoiack,,Republican,573-751-3666,317-A,009,2020,3,M,Savannah
Rudy,Veit,,Republican,573-751-0665,206-C,059,2018,2,M,Wardsville
Jeff,Vernetti,,Republican,573-751-1119,409-B,123,2024,4,M,Camdenton
Terri,Violet,,Republican,573-751-2250,118-CC,104,2024,1,F,St. Peters
John,Voss,,Republican,573-751-1443,110-A,147,2022,1,M,Cape Girardeau
Bridget,Walsh Moore,Minority Caucus Policy Chair,Democrat,573-751-0211,105-D,093,2020,1,F,St. Louis
Christopher,Warwick,,Republican,573-751-1347,201-C,128,2024,2,M,Bolivar
Emily,Weber,Minority Caucus Chair,Democrat,573-751-4485,101-D,024,2020,1,F,Kansas City
Colin,Wellenkamp,,Republican,573-751-2949,115-F,105,2024,1,M,St. Charles
Richard,West,,Republican,573-751-9768,200-A,102,2020,2,M,Wentzville
Burt,Whaley,,Republican,573-751-3851,201-CA,138,2024,2,M,Clever
Cecelie,Williams,,Republican,573-751-4567,236-B,111,2024,2,F,Dittmer
Travis,Wilson,,Republican,573-751-1452,201-A,106,2022,2,M,St. Charles
Bryant,Wolfin,,Republican,573-751-5912,111,145,2024,1,M,Ste. Genevieve
Eric,Woods,Minority Caucus Secretary,Democrat,573-751-2199,107,018,2022,1,M,Kansas City
Dale,Wright,,Republican,573-751-3455,115-A,116,2018,1,M,Farmington
Yolanda,Young,,Democrat,573-751-3129,105-A,022,2019,1,F,Kansas City
Jaclyn,Zimmermann,,Democrat,573-751-4392,109-G,098,2024,1,F,Manchester`;

const parseCsv = (value: string): string[][] => {
  return value
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(','))
    .filter((cells) => cells.some((cell) => cell.trim().length > 0));
};

export const missouriHouseOfficials: Official[] = parseCsv(rosterCsv)
  .slice(1)
  .flatMap((cells) => {
    const [firstName, lastName, leadershipPositionCurrent, party, phone, room, district, yearEnter, floor, gender, homeTown] = cells;
    const fullName = [firstName, lastName].filter(Boolean).map((part) => part.trim()).join(' ');

    if (!fullName || fullName.toLowerCase().includes('vacant')) {
      return [];
    }

    const normalizedDistrict = (district ?? '').trim();
    const normalizedTitle = (leadershipPositionCurrent ?? '').trim();

    return [
      {
        id: `${fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${normalizedDistrict || 'district'}`,
        fullName,
        officeTitle: normalizedTitle || 'State Representative',
        jurisdiction: normalizedDistrict ? `Missouri House District ${normalizedDistrict}` : 'Missouri House District',
        level: 'state' as const,
        email: '',
        phone: phone?.trim() || '',
        sourceUrl: normalizedDistrict
          ? `https://www.house.mo.gov/MemberDetails.aspx?district=${normalizedDistrict}`
          : 'https://www.house.mo.gov/',
      },
    ];
  });

export async function getOfficials(): Promise<Official[]> {
  return missouriHouseOfficials;
}

export async function getOfficialById(id: string): Promise<Official | undefined> {
  return missouriHouseOfficials.find((official) => official.id === id);
}
