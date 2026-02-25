-- Seed More Default Sheets

INSERT INTO public.sheet (title, items, is_default)
VALUES (
    'Zoo Animals',
    ARRAY[
        'Lion', 'Tiger', 'Elephant', 'Giraffe', 'Zebra',
        'Gorilla', 'Monkey', 'Hippo', 'Crocodile', 'Penguin',
        'Flamingo', 'Kangaroo', 'Koala', 'Panda', 'Polar Bear',
        'Red Panda', 'Sloth', 'Otter', 'Cheetah', 'Rhino',
        'Ostrich', 'Peacock', 'Snow Leopard', 'Meerkat', 'Lemur',
        'Chimpanzee', 'Orangutan', 'Gibbon', 'Wallaby', 'Wombat'
    ],
    TRUE
),
(
    'Disneyland Characters',
    ARRAY[
        'Mickey Mouse', 'Minnie Mouse', 'Donald Duck', 'Daisy Duck', 'Goofy',
        'Pluto', 'Cinderella', 'Snow White', 'Ariel', 'Belle',
        'Jasmine', 'Aurora', 'Mulan', 'Pocahontas', 'Tiana',
        'Rapunzel', 'Merida', 'Elsa', 'Anna', 'Olaf',
        'Simba', 'Timon', 'Pumbaa', 'Buzz Lightyear', 'Woody',
        'Peter Pan', 'Wendy', 'Captain Hook', 'Tinker Bell', 'Alice'
    ],
    TRUE
);
