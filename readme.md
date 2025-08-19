Configuration for the redis setup on the local environment

# To run redis with a password, first create a redis.conf file on the redis folder which is ignored in git with the following contents:

```
requirepass rock@1812002
```

# Then, run the following command to start the redis container:

```
docker run -d --name redis-secure \
 -v $(pwd)/redis/redis.conf:/usr/local/etc/redis/redis.conf \
 -p 6379:6379 \
 redis:latest redis-server /usr/local/etc/redis/redis.conf
```


# This command for Window System (if they get DNS network Error)
  
step 1:
Pull the BusyBox image and run a DNS lookup. This refreshes Docker’s DNS configuration.

```
docker run --rm busybox nslookup google.com

```

step 2:
Manually pull the Redis image.

```
docker pull redis:latest

```
step:3 (One line Command)
```
docker run -d --name redis-secure -v ${PWD}\redis\redis.conf:/usr/local/etc/redis/redis.conf -p 6379:6379 redis:latest redis-server /usr/local/etc/redis/redis.conf

```
# This will start a redis container with a password, and map port 6379 from the container to port 6379 on the host machine.
